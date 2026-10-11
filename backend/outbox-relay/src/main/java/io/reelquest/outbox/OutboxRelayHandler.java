package io.reelquest.outbox;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class OutboxRelayHandler implements RequestHandler<DynamodbEvent, Void> {

    private static final Logger log = LoggerFactory.getLogger(OutboxRelayHandler.class);
    private static final String DEFAULT_BUS = "reelquest-dev-bus";
    private static final String DEFAULT_TABLE = "reelquest-dev-data";

    private final EventBridgeClient eventBridgeClient;
    private final DynamoDbClient dynamoDbClient;
    private final String eventBusName;
    private final String tableName;

    public OutboxRelayHandler() {
        String regionStr = System.getenv().getOrDefault("AWS_REGION", "eu-central-1");
        this.eventBusName = System.getenv().getOrDefault("EVENT_BUS_NAME", DEFAULT_BUS);
        this.tableName = System.getenv().getOrDefault("DYNAMODB_TABLE", DEFAULT_TABLE);
        this.eventBridgeClient = EventBridgeClient.builder().region(Region.of(regionStr)).build();
        this.dynamoDbClient = DynamoDbClient.builder().region(Region.of(regionStr)).build();
    }

    public OutboxRelayHandler(
            EventBridgeClient eventBridgeClient,
            DynamoDbClient dynamoDbClient,
            String eventBusName,
            String tableName
    ) {
        this.eventBridgeClient = Objects.requireNonNull(eventBridgeClient);
        this.dynamoDbClient = Objects.requireNonNull(dynamoDbClient);
        this.eventBusName = Objects.requireNonNull(eventBusName);
        this.tableName = Objects.requireNonNull(tableName);
    }

    @Override
    public Void handleRequest(DynamodbEvent dynamodbEvent, Context context) {
        if (dynamodbEvent == null || dynamodbEvent.getRecords() == null) {
            return null;
        }

        List<PutEventsRequestEntry> entries = new ArrayList<>();
        List<Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue>> itemsToDelete = new ArrayList<>();

        for (DynamodbEvent.DynamodbStreamRecord record : dynamodbEvent.getRecords()) {
            if (!"INSERT".equalsIgnoreCase(record.getEventName())) {
                continue;
            }

            Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
            if (newImage == null || !newImage.containsKey("PK") || !newImage.containsKey("Type")) {
                continue;
            }

            String pk = newImage.get("PK").getS();
            String type = newImage.get("Type").getS();

            if (!pk.startsWith("OUTBOX#") || !"OUTBOX".equalsIgnoreCase(type)) {
                continue;
            }

            String eventType = newImage.containsKey("EventType") ? newImage.get("EventType").getS() : "GenericEvent";
            String payload = newImage.containsKey("Payload") ? newImage.get("Payload").getS() : "{}";
            String sk = newImage.get("SK").getS();

            entries.add(PutEventsRequestEntry.builder()
                    .eventBusName(eventBusName)
                    .source("reelquest.game")
                    .detailType(eventType)
                    .detail(payload)
                    .build());

            itemsToDelete.add(Map.of(
                    "PK", software.amazon.awssdk.services.dynamodb.model.AttributeValue.fromS(pk),
                    "SK", software.amazon.awssdk.services.dynamodb.model.AttributeValue.fromS(sk)
            ));
        }

        if (entries.isEmpty()) {
            return null;
        }

        PutEventsRequest request = PutEventsRequest.builder().entries(entries).build();
        var response = eventBridgeClient.putEvents(request);

        for (int i = 0; i < response.entries().size(); i++) {
            var resultEntry = response.entries().get(i);
            if (resultEntry.eventId() != null) {
                Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> key = itemsToDelete.get(i);
                dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                        .tableName(tableName)
                        .key(key)
                        .build());
            } else {
                log.error("Failed to relay outbox event to EventBridge: {}", resultEntry.errorMessage());
            }
        }

        return null;
    }
}
