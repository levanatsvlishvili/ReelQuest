package io.reelquest.outbox;

import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
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
    @DisplayName("Should process SQS GameCompleted event and update leaderboard and user profile")
    void shouldProcessSqsGameCompletedEvent() {
        String jsonPayload = """
                {
                    "userId": "user123",
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

        assertThat(testDynamoDb.savedItems).hasSize(1);
        var leaderboardItem = testDynamoDb.savedItems.getFirst().item();
        assertThat(leaderboardItem.get("PK").s()).isEqualTo("LEADERBOARD#2026-10-11");
        assertThat(leaderboardItem.get("userId").s()).isEqualTo("user123");
        assertThat(leaderboardItem.get("score").n()).isEqualTo("9500");

        assertThat(testDynamoDb.updatedItems).hasSize(1);
        var profileUpdate = testDynamoDb.updatedItems.getFirst();
        assertThat(profileUpdate.key().get("PK").s()).isEqualTo("USER#user123");
        assertThat(profileUpdate.updateExpression()).contains("ADD gamesPlayed :one, totalScore :score");
    }

    private static class TestDynamoDbClient implements DynamoDbClient {
        final List<PutItemRequest> savedItems = new ArrayList<>();
        final List<UpdateItemRequest> updatedItems = new ArrayList<>();

        @Override
        public String serviceName() { return "DynamoDb"; }

        @Override
        public void close() {}

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
