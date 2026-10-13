package io.reelquest.domain.model;

public record Order(
        String orderId,
        String userId,
        long amountCents,
        String currency,
        OrderStatus status,
        String paymentProvider,
        String checkoutSessionId,
        String paymentId,
        String createdAt,
        String updatedAt,
        String failureReason
) {
    public static Order createNew(String orderId, String userId, long amountCents, String currency, String provider, String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.PENDING,
                provider,
                null,
                null,
                timestamp,
                timestamp,
                null
        );
    }

    public Order withCheckoutSession(String sessionId, String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.PAYMENT_INITIATED,
                paymentProvider,
                sessionId,
                paymentId,
                createdAt,
                timestamp,
                null
        );
    }

    public Order withPaymentSuccess(String paymentId, String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.PAYMENT_SUCCEEDED,
                paymentProvider,
                checkoutSessionId,
                paymentId,
                createdAt,
                timestamp,
                null
        );
    }

    public Order withCompleted(String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.COMPLETED,
                paymentProvider,
                checkoutSessionId,
                paymentId,
                createdAt,
                timestamp,
                null
        );
    }

    public Order withCancelled(String reason, String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.CANCELLED,
                paymentProvider,
                checkoutSessionId,
                paymentId,
                createdAt,
                timestamp,
                reason
        );
    }

    public Order withRefunded(String reason, String timestamp) {
        return new Order(
                orderId,
                userId,
                amountCents,
                currency,
                OrderStatus.REFUNDED,
                paymentProvider,
                checkoutSessionId,
                paymentId,
                createdAt,
                timestamp,
                reason
        );
    }
}
