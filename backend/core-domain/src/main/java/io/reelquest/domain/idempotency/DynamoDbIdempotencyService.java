package io.reelquest.domain.idempotency;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public class DynamoDbIdempotencyService implements IdempotencyService {

    private final DynamoDbClient client;
    private final String tableName;

    public DynamoDbIdempotencyService(DynamoDbClient client, String tableName) {
        this.client = Objects.requireNonNull(client, "client must not be null");
        this.tableName = Objects.requireNonNull(tableName, "tableName must not be null");
    }

    @Override
    public boolean tryAcquireLock(String idempotencyKey, Duration ttl) {
        long expiresAtEpoch = Instant.now().plus(ttl).getEpochSecond();

        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS("IDEMPOTENCY#" + idempotencyKey));
        item.put("SK", AttributeValue.fromS("LOCK"));
        item.put("Status", AttributeValue.fromS(IdempotencyStatus.IN_PROGRESS.name()));
        item.put("ExpiresAt", AttributeValue.fromN(String.valueOf(expiresAtEpoch)));

        PutItemRequest request = PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .conditionExpression("attribute_not_exists(PK)")
                .build();

        try {
            client.putItem(request);
            return true;
        } catch (ConditionalCheckFailedException e) {
            return false;
        }
    }

    @Override
    public Optional<IdempotencyRecord> getRecord(String idempotencyKey) {
        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("IDEMPOTENCY#" + idempotencyKey),
                        "SK", AttributeValue.fromS("LOCK")
                ))
                .build();

        var response = client.getItem(request);
        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }

        Map<String, AttributeValue> item = response.item();
        IdempotencyStatus status = IdempotencyStatus.valueOf(item.get("Status").s());
        String responseBody = item.containsKey("ResponseBody") ? item.get("ResponseBody").s() : null;
        long expiresAt = item.containsKey("ExpiresAt") ? Long.parseLong(item.get("ExpiresAt").n()) : 0;

        return Optional.of(new IdempotencyRecord(idempotencyKey, status, responseBody, expiresAt));
    }

    @Override
    public void markCompleted(String idempotencyKey, String responseBody) {
        UpdateItemRequest request = UpdateItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("IDEMPOTENCY#" + idempotencyKey),
                        "SK", AttributeValue.fromS("LOCK")
                ))
                .updateExpression("SET #status = :status, #body = :body")
                .expressionAttributeNames(Map.of(
                        "#status", "Status",
                        "#body", "ResponseBody"
                ))
                .expressionAttributeValues(Map.of(
                        ":status", AttributeValue.fromS(IdempotencyStatus.COMPLETED.name()),
                        ":body", AttributeValue.fromS(responseBody != null ? responseBody : "")
                ))
                .build();

        client.updateItem(request);
    }
}
