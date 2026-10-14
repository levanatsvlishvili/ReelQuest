package io.reelquest.outbox;

import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemResponse;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LeaderboardConsumerHandlerTest {

    private TestDynamoDbClient testDynamoDb;
    private LeaderboardConsumerHandler handler;

    @BeforeEach
    void setUp() {
        testDynamoDb = new TestDynamoDbClient();
        handler = new LeaderboardConsumerHandler(testDynamoDb, "test-table");
    }

    @Test
    @DisplayName("Should process SQS GameCompleted event and update daily leaderboard, all-time leaderboard and user profile")
    void shouldProcessSqsGameCompletedEvent() {
        String jsonPayload = """
                {
                    "userId": "user123",
                    "username": "CineMaster",
                    "isPro": true,
                    "date": "2026-10-11",
                    "score": 9500,
                    "moves": 2,
                    "durationSeconds": 45,
                    "timestamp": "2026-10-11T12:00:00Z"
                }
                """;

        SQSEvent.SQSMessage message = new SQSEvent.SQSMessage();
        message.setMessageId("msg-1");
        message.setBody(jsonPayload);

        SQSEvent event = new SQSEvent();
        event.setRecords(List.of(message));

        handler.handleRequest(event, null);

        // Daily item and All-Time item saved
        assertThat(testDynamoDb.savedItems).hasSize(2);

        var dailyItem = testDynamoDb.savedItems.get(0).item();
        assertThat(dailyItem.get("PK").s()).isEqualTo("LEADERBOARD#2026-10-11");
        assertThat(dailyItem.get("userId").s()).isEqualTo("user123");
        assertThat(dailyItem.get("username").s()).isEqualTo("CineMaster");
        assertThat(dailyItem.get("score").n()).isEqualTo("9500");
        assertThat(dailyItem.get("isPro").bool()).isTrue();

        var allTimeItem = testDynamoDb.savedItems.get(1).item();
        assertThat(allTimeItem.get("PK").s()).isEqualTo("LEADERBOARD#ALL_TIME");
        assertThat(allTimeItem.get("userId").s()).isEqualTo("user123");
        assertThat(allTimeItem.get("username").s()).isEqualTo("CineMaster");
        assertThat(allTimeItem.get("score").n()).isEqualTo("9500");
        assertThat(allTimeItem.get("isPro").bool()).isTrue();

        assertThat(testDynamoDb.updatedItems).hasSize(1);
        var profileUpdate = testDynamoDb.updatedItems.getFirst();
        assertThat(profileUpdate.key().get("PK").s()).isEqualTo("USER#user123");
        assertThat(profileUpdate.updateExpression()).contains("ADD gamesPlayed :one, gamesWon :one, totalScore :score");
    }

    private static class TestDynamoDbClient implements DynamoDbClient {
        final List<PutItemRequest> savedItems = new ArrayList<>();
        final List<UpdateItemRequest> updatedItems = new ArrayList<>();

        @Override
        public String serviceName() { return "DynamoDb"; }

        @Override
        public void close() {}

        @Override
        public GetItemResponse getItem(GetItemRequest getItemRequest) {
            return GetItemResponse.builder().build();
        }

        @Override
        public PutItemResponse putItem(PutItemRequest putItemRequest) {
            savedItems.add(putItemRequest);
            return PutItemResponse.builder().build();
        }

        @Override
        public UpdateItemResponse updateItem(UpdateItemRequest updateItemRequest) {
            updatedItems.add(updateItemRequest);
            return UpdateItemResponse.builder().build();
        }
    }
}
