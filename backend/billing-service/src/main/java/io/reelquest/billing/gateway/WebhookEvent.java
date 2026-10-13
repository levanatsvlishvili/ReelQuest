package io.reelquest.billing.gateway;

public record WebhookEvent(
        String eventId,
        String eventType,
        String orderId,
        String paymentId,
        long amountCents,
        boolean success,
        String rawPayload
) {
}
