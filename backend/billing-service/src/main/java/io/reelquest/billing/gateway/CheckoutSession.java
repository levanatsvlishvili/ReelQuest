package io.reelquest.billing.gateway;

public record CheckoutSession(
        String sessionId,
        String checkoutUrl,
        String provider,
        String orderId
) {
    public CheckoutSession(String sessionId, String checkoutUrl, String provider) {
        this(sessionId, checkoutUrl, provider, null);
    }
}
