package io.reelquest.billing.repository;

import io.reelquest.domain.model.Order;
import io.reelquest.domain.model.OrderStatus;
import io.reelquest.domain.model.SubscriptionTier;
import io.reelquest.domain.model.UserProfile;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ConditionalCheckFailedException;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.Put;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItemsRequest;
import software.amazon.awssdk.services.dynamodb.model.Update;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public class BillingRepository {

    private final DynamoDbClient dynamoDbClient;
    private final String tableName;

    public BillingRepository(DynamoDbClient dynamoDbClient, String tableName) {
        this.dynamoDbClient = dynamoDbClient;
        this.tableName = tableName;
    }

    public void saveOrder(Order order) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS("ORDER#" + order.orderId()));
        item.put("SK", AttributeValue.fromS("METADATA"));
        item.put("GSI1PK", AttributeValue.fromS("USER#" + order.userId()));
        item.put("GSI1SK", AttributeValue.fromS("ORDER#" + order.createdAt()));
        item.put("Type", AttributeValue.fromS("ORDER"));
        item.put("orderId", AttributeValue.fromS(order.orderId()));
        item.put("userId", AttributeValue.fromS(order.userId()));
        item.put("amountCents", AttributeValue.fromN(String.valueOf(order.amountCents())));
        item.put("currency", AttributeValue.fromS(order.currency()));
        item.put("status", AttributeValue.fromS(order.status().name()));
        item.put("paymentProvider", AttributeValue.fromS(order.paymentProvider()));
        if (order.checkoutSessionId() != null) item.put("checkoutSessionId", AttributeValue.fromS(order.checkoutSessionId()));
        if (order.paymentId() != null) item.put("paymentId", AttributeValue.fromS(order.paymentId()));
        item.put("createdAt", AttributeValue.fromS(order.createdAt()));
        item.put("updatedAt", AttributeValue.fromS(order.updatedAt()));
        if (order.failureReason() != null) item.put("failureReason", AttributeValue.fromS(order.failureReason()));

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build());
    }

    public Optional<Order> findOrderById(String orderId) {
        var response = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("ORDER#" + orderId),
                        "SK", AttributeValue.fromS("METADATA")
                ))
                .build());

        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }

        Map<String, AttributeValue> item = response.item();
        return Optional.of(new Order(
                item.get("orderId").s(),
                item.get("userId").s(),
                Long.parseLong(item.get("amountCents").n()),
                item.get("currency").s(),
                OrderStatus.valueOf(item.get("status").s()),
                item.get("paymentProvider").s(),
                item.containsKey("checkoutSessionId") ? item.get("checkoutSessionId").s() : null,
                item.containsKey("paymentId") ? item.get("paymentId").s() : null,
                item.get("createdAt").s(),
                item.get("updatedAt").s(),
                item.containsKey("failureReason") ? item.get("failureReason").s() : null
        ));
    }

    public Optional<UserProfile> findUserProfile(String userId) {
        var response = dynamoDbClient.getItem(GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("USER#" + userId),
                        "SK", AttributeValue.fromS("PROFILE")
                ))
                .build());

        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }

        Map<String, AttributeValue> item = response.item();
        return Optional.of(new UserProfile(
                item.get("userId").s(),
                item.get("username").s(),
                item.get("email").s(),
                SubscriptionTier.valueOf(item.getOrDefault("tier", AttributeValue.fromS("FREE")).s()),
                item.containsKey("gamesPlayed") ? Integer.parseInt(item.get("gamesPlayed").n()) : 0,
                item.containsKey("gamesWon") ? Integer.parseInt(item.get("gamesWon").n()) : 0,
                item.containsKey("streak") ? Integer.parseInt(item.get("streak").n()) : 0,
                item.containsKey("bestHops") ? Integer.parseInt(item.get("bestHops").n()) : 0,
                item.containsKey("totalScore") ? Long.parseLong(item.get("totalScore").n()) : 0L,
                item.containsKey("createdAt") ? item.get("createdAt").s() : Instant.now().toString(),
                item.containsKey("updatedAt") ? item.get("updatedAt").s() : Instant.now().toString()
        ));
    }

    public void saveUserProfile(UserProfile profile) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS("USER#" + profile.userId()));
        item.put("SK", AttributeValue.fromS("PROFILE"));
        item.put("GSI1PK", AttributeValue.fromS("EMAIL#" + profile.email()));
        item.put("GSI1SK", AttributeValue.fromS("STATUS#" + profile.tier().name()));
        item.put("Type", AttributeValue.fromS("USER_PROFILE"));
        item.put("userId", AttributeValue.fromS(profile.userId()));
        item.put("username", AttributeValue.fromS(profile.username()));
        item.put("email", AttributeValue.fromS(profile.email()));
        item.put("tier", AttributeValue.fromS(profile.tier().name()));
        item.put("gamesPlayed", AttributeValue.fromN(String.valueOf(profile.gamesPlayed())));
        item.put("gamesWon", AttributeValue.fromN(String.valueOf(profile.gamesWon())));
        item.put("streak", AttributeValue.fromN(String.valueOf(profile.streak())));
        item.put("bestHops", AttributeValue.fromN(String.valueOf(profile.bestHops())));
        item.put("totalScore", AttributeValue.fromN(String.valueOf(profile.totalScore())));
        item.put("createdAt", AttributeValue.fromS(profile.createdAt()));
        item.put("updatedAt", AttributeValue.fromS(profile.updatedAt()));

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(tableName)
                .item(item)
                .build());
    }

    public boolean tryAcquireWebhookLock(String eventId) {
        long expiresAt = Instant.now().getEpochSecond() + (7 * 86400); // 7-day TTL
        Map<String, AttributeValue> item = Map.of(
                "PK", AttributeValue.fromS("IDEMPOTENCY#WEBHOOK#" + eventId),
                "SK", AttributeValue.fromS("LOCK"),
                "Type", AttributeValue.fromS("WEBHOOK_LOCK"),
                "eventId", AttributeValue.fromS(eventId),
                "processedAt", AttributeValue.fromS(Instant.now().toString()),
                "ExpiresAt", AttributeValue.fromN(String.valueOf(expiresAt))
        );

        try {
            dynamoDbClient.putItem(PutItemRequest.builder()
                    .tableName(tableName)
                    .item(item)
                    .conditionExpression("attribute_not_exists(PK)")
                    .build());
            return true;
        } catch (ConditionalCheckFailedException e) {
            return false;
        }
    }

    public void completeOrderAndGrantPro(Order order, String timestamp) {
        // Atomic transaction: Finalize Order status COMPLETED + Upgrade User Profile tier PRO
        TransactWriteItemsRequest tx = TransactWriteItemsRequest.builder()
                .transactItems(
                        TransactWriteItem.builder()
                                .update(Update.builder()
                                        .tableName(tableName)
                                        .key(Map.of(
                                                "PK", AttributeValue.fromS("ORDER#" + order.orderId()),
                                                "SK", AttributeValue.fromS("METADATA")
                                        ))
                                        .updateExpression("SET #st = :status, paymentId = :pid, updatedAt = :ts")
                                        .expressionAttributeNames(Map.of("#st", "status"))
                                        .expressionAttributeValues(Map.of(
                                                ":status", AttributeValue.fromS(OrderStatus.COMPLETED.name()),
                                                ":pid", AttributeValue.fromS(order.paymentId() != null ? order.paymentId() : "paid"),
                                                ":ts", AttributeValue.fromS(timestamp)
                                        ))
                                        .build())
                                .build(),
                        TransactWriteItem.builder()
                                .update(Update.builder()
                                        .tableName(tableName)
                                        .key(Map.of(
                                                "PK", AttributeValue.fromS("USER#" + order.userId()),
                                                "SK", AttributeValue.fromS("PROFILE")
                                        ))
                                        .updateExpression("SET tier = :tier, GSI1SK = :statusTier, updatedAt = :ts")
                                        .expressionAttributeValues(Map.of(
                                                ":tier", AttributeValue.fromS(SubscriptionTier.PRO.name()),
                                                ":statusTier", AttributeValue.fromS("STATUS#PRO"),
                                                ":ts", AttributeValue.fromS(timestamp)
                                        ))
                                        .build())
                                .build()
                )
                .build();

        dynamoDbClient.transactWriteItems(tx);
    }
}
