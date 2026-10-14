package io.reelquest.outbox;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ReturnValue;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

public class LeaderboardConsumerHandler implements RequestHandler<SQSEvent, Void> {

    private static final Logger log = LoggerFactory.getLogger(LeaderboardConsumerHandler.class);
    private static final String DEFAULT_TABLE = "reelquest-dev-data";

    private final ObjectMapper objectMapper;
    private final DynamoDbClient dynamoDbClient;
    private final String tableName;

    public LeaderboardConsumerHandler() {
        this.objectMapper = new ObjectMapper();
        String regionStr = System.getenv().getOrDefault("AWS_REGION", "eu-central-1");
        this.tableName = System.getenv().getOrDefault("DYNAMODB_TABLE", DEFAULT_TABLE);
        this.dynamoDbClient = DynamoDbClient.builder().region(Region.of(regionStr)).build();
    }

    public LeaderboardConsumerHandler(DynamoDbClient dynamoDbClient, String tableName) {
        this.objectMapper = new ObjectMapper();
        this.dynamoDbClient = Objects.requireNonNull(dynamoDbClient);
        this.tableName = Objects.requireNonNull(tableName);
    }

    @Override
    public Void handleRequest(SQSEvent sqsEvent, Context context) {
        if (sqsEvent == null || sqsEvent.getRecords() == null) {
            return null;
        }

        for (SQSEvent.SQSMessage message : sqsEvent.getRecords()) {
            try {
                processMessage(message.getBody());
            } catch (Exception e) {
                log.error("Failed to process leaderboard message {}: {}", message.getMessageId(), e.getMessage(), e);
                throw new RuntimeException(e);
            }
        }

        return null;
    }

    private void processMessage(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);

        // If routed through EventBridge, payload is nested inside "detail"
        JsonNode payload = root.has("detail") ? root.get("detail") : root;

        String userId = payload.get("userId").asText();
        if (userId == null || userId.isBlank() || userId.startsWith("guest")) {
            log.info("Skipping leaderboard aggregation for guest user: {}", userId);
            return;
        }
        String date = payload.get("date").asText();
        long score = payload.get("score").asLong();
        int moves = payload.get("moves").asInt();
        long durationSeconds = payload.get("durationSeconds").asLong();
        String timestamp = payload.has("timestamp") ? payload.get("timestamp").asText() : "";

        String username = payload.has("username") ? payload.get("username").asText() : null;
        Boolean isPro = payload.has("isPro") ? payload.get("isPro").asBoolean() : null;

        if (username == null || isPro == null) {
            if (userId != null && !userId.startsWith("guest")) {
                try {
                    var profileRes = dynamoDbClient.getItem(GetItemRequest.builder()
                            .tableName(tableName)
                            .key(Map.of(
                                    "PK", AttributeValue.fromS("USER#" + userId),
                                    "SK", AttributeValue.fromS("PROFILE")
                            ))
                            .build());
                    if (profileRes.hasItem() && profileRes.item() != null) {
                        Map<String, AttributeValue> item = profileRes.item();
                        if (username == null && item.containsKey("username")) {
                            username = item.get("username").s();
                        }
                        if (isPro == null && item.containsKey("tier")) {
                            isPro = "PRO".equalsIgnoreCase(item.get("tier").s());
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to lookup profile for userId {}: {}", userId, e.getMessage());
                }
            }
        }

        if (username == null || username.isBlank()) {
            username = userId.startsWith("guest") ? "Guest Cinephile" : userId;
        }
        if (isPro == null) {
            isPro = false;
        }

        // Format inverted score so GSI1 naturally sorts highest score first
        String invertedScore = String.format("%08d", Math.max(0, 99_999_999L - score));

        Map<String, AttributeValue> leaderboardItem = new HashMap<>();
        leaderboardItem.put("PK", AttributeValue.fromS("LEADERBOARD#" + date));
        leaderboardItem.put("SK", AttributeValue.fromS("USER#" + userId));
        leaderboardItem.put("GSI1PK", AttributeValue.fromS("LEADERBOARD#" + date));
        leaderboardItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + invertedScore));
        leaderboardItem.put("Type", AttributeValue.fromS("LEADERBOARD_ENTRY"));
        leaderboardItem.put("userId", AttributeValue.fromS(userId));
        leaderboardItem.put("username", AttributeValue.fromS(username));
        leaderboardItem.put("score", AttributeValue.fromN(String.valueOf(score)));
        leaderboardItem.put("moves", AttributeValue.fromN(String.valueOf(moves)));
        leaderboardItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(durationSeconds)));
        leaderboardItem.put("isPro", AttributeValue.fromBool(isPro));
        leaderboardItem.put("updatedAt", AttributeValue.fromS(timestamp));

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(leaderboardItem)
                .build());

        // Update User Aggregate Profile Stats
        long newTotalScore = score;
        int newGamesPlayed = 1;
        try {
            var updateRes = dynamoDbClient.updateItem(UpdateItemRequest.builder()
                    .tableName(tableName)
                    .key(Map.of(
                            "PK", AttributeValue.fromS("USER#" + userId),
                            "SK", AttributeValue.fromS("PROFILE")
                    ))
                    .updateExpression("ADD gamesPlayed :one, gamesWon :one, totalScore :score")
                    .expressionAttributeValues(Map.of(
                            ":one", AttributeValue.fromN("1"),
                            ":score", AttributeValue.fromN(String.valueOf(score))
                    ))
                    .returnValues(ReturnValue.ALL_NEW)
                    .build());

            if (updateRes.hasAttributes() && updateRes.attributes() != null) {
                var attrs = updateRes.attributes();
                if (attrs.containsKey("totalScore")) {
                    newTotalScore = Long.parseLong(attrs.get("totalScore").n());
                }
                if (attrs.containsKey("gamesPlayed")) {
                    newGamesPlayed = Integer.parseInt(attrs.get("gamesPlayed").n());
                }
            }
        } catch (Exception e) {
            log.warn("Could not update profile stats for userId {}: {}", userId, e.getMessage());
        }

        // Update All-Time Leaderboard
        String invertedAllTimeScore = String.format("%010d", Math.max(0, 999_999_999L - newTotalScore));
        Map<String, AttributeValue> allTimeItem = new HashMap<>();
        allTimeItem.put("PK", AttributeValue.fromS("LEADERBOARD#ALL_TIME"));
        allTimeItem.put("SK", AttributeValue.fromS("USER#" + userId));
        allTimeItem.put("GSI1PK", AttributeValue.fromS("LEADERBOARD#ALL_TIME"));
        allTimeItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + invertedAllTimeScore));
        allTimeItem.put("Type", AttributeValue.fromS("LEADERBOARD_ALL_TIME"));
        allTimeItem.put("userId", AttributeValue.fromS(userId));
        allTimeItem.put("username", AttributeValue.fromS(username));
        allTimeItem.put("score", AttributeValue.fromN(String.valueOf(newTotalScore)));
        allTimeItem.put("moves", AttributeValue.fromN(String.valueOf(newGamesPlayed)));
        allTimeItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(durationSeconds)));
        allTimeItem.put("isPro", AttributeValue.fromBool(isPro));
        allTimeItem.put("updatedAt", AttributeValue.fromS(timestamp));

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(allTimeItem)
                .build());
    }
}
