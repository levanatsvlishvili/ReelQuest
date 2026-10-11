package io.reelquest.outbox;

import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.StreamRecord;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemResponse;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResponse;
import software.amazon.awssdk.services.eventbridge.model.PutEventsResultEntry;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OutboxRelayHandlerTest {

    private TestEventBridgeClient testEventBridge;
    private TestDynamoDbClient testDynamoDb;
    private OutboxRelayHandler handler;

    @BeforeEach
    void setUp() {
        testEventBridge = new TestEventBridgeClient();
        testDynamoDb = new TestDynamoDbClient();
        handler = new OutboxRelayHandler(testEventBridge, testDynamoDb, "test-bus", "test-table");
    }

    @Test
    @DisplayName("Should relay OUTBOX INSERT record to EventBridge and delete from DynamoDB")
    void shouldRelayOutboxRecordToEventBridge() {
        DynamodbEvent.DynamodbStreamRecord record = new DynamodbEvent.DynamodbStreamRecord();
        record.setEventName("INSERT");

        StreamRecord streamRecord = new StreamRecord();
        streamRecord.setNewImage(Map.of(
                "PK", new AttributeValue().withS("OUTBOX#evt-123"),
                "SK", new AttributeValue().withS("TIMESTAMP#2026-10-11T00:00:00Z"),
                "Type", new AttributeValue().withS("OUTBOX"),
                "EventType", new AttributeValue().withS("GameCompleted"),
                "Payload", new AttributeValue().withS("{\"score\":9500,\"userId\":\"u1\"}")
        ));
        record.setDynamodb(streamRecord);

        DynamodbEvent event = new DynamodbEvent();
        event.setRecords(List.of(record));

        handler.handleRequest(event, null);

        assertThat(testEventBridge.sentRequests).hasSize(1);
        var entry = testEventBridge.sentRequests.getFirst().entries().getFirst();
        assertThat(entry.source()).isEqualTo("reelquest.game");
        assertThat(entry.detailType()).isEqualTo("GameCompleted");
        assertThat(entry.detail()).isEqualTo("{\"score\":9500,\"userId\":\"u1\"}");

        assertThat(testDynamoDb.deletedItems).hasSize(1);
        var deletedKey = testDynamoDb.deletedItems.getFirst().key();
        assertThat(deletedKey.get("PK").s()).isEqualTo("OUTBOX#evt-123");
    }

    private static class TestEventBridgeClient implements EventBridgeClient {
        final List<PutEventsRequest> sentRequests = new ArrayList<>();

        @Override
        public String serviceName() { return "EventBridge"; }

        @Override
        public void close() {}

        @Override
        public PutEventsResponse putEvents(PutEventsRequest putEventsRequest) {
            sentRequests.add(putEventsRequest);
            return PutEventsResponse.builder()
                    .entries(PutEventsResultEntry.builder().eventId("eb-evt-1").build())
                    .build();
        }
    }

    private static class TestDynamoDbClient implements DynamoDbClient {
        final List<DeleteItemRequest> deletedItems = new ArrayList<>();

        @Override
        public String serviceName() { return "DynamoDb"; }

        @Override
        public void close() {}

        @Override
        public DeleteItemResponse deleteItem(DeleteItemRequest deleteItemRequest) {
            deletedItems.add(deleteItemRequest);
            return DeleteItemResponse.builder().build();
        }
    }
}
