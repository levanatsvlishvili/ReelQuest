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
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
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
        String date = payload.get("date").asText();
        long score = payload.get("score").asLong();
        int moves = payload.get("moves").asInt();
        long durationSeconds = payload.get("durationSeconds").asLong();
        String timestamp = payload.has("timestamp") ? payload.get("timestamp").asText() : "";

        // Format inverted score so GSI1 naturally sorts highest score first
        String invertedScore = String.format("%08d", Math.max(0, 99_999_999L - score));

        Map<String, AttributeValue> leaderboardItem = new HashMap<>();
        leaderboardItem.put("PK", AttributeValue.fromS("LEADERBOARD#" + date));
        leaderboardItem.put("SK", AttributeValue.fromS("USER#" + userId));
        leaderboardItem.put("GSI1PK", AttributeValue.fromS("LEADERBOARD#" + date));
        leaderboardItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + invertedScore));
        leaderboardItem.put("Type", AttributeValue.fromS("LEADERBOARD_ENTRY"));
        leaderboardItem.put("userId", AttributeValue.fromS(userId));
        leaderboardItem.put("score", AttributeValue.fromN(String.valueOf(score)));
        leaderboardItem.put("moves", AttributeValue.fromN(String.valueOf(moves)));
        leaderboardItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(durationSeconds)));
        leaderboardItem.put("updatedAt", AttributeValue.fromS(timestamp));

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(leaderboardItem)
                .build());

        // Update User Aggregate Profile Stats
        dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("USER#" + userId),
                        "SK", AttributeValue.fromS("PROFILE")
                ))
                .updateExpression("ADD gamesPlayed :one, totalScore :score")
                .expressionAttributeValues(Map.of(
                        ":one", AttributeValue.fromN("1"),
                        ":score", AttributeValue.fromN(String.valueOf(score))
                ))
                .build());
    }
}
