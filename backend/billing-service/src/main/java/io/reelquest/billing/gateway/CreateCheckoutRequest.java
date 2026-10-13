package io.reelquest.billing.gateway;

public record CreateCheckoutRequest(
        String orderId,
        String userId,
        String email,
        long amountCents,
        String currency,
        String successUrl,
        String cancelUrl
) {
}
