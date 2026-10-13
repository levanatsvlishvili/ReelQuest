package io.reelquest.billing.gateway;

public interface PaymentGateway {

    CheckoutSession createCheckoutSession(CreateCheckoutRequest request);

    WebhookEvent verifyAndParseWebhook(String rawPayload, String signatureHeader);

    RefundResult refundPayment(String paymentId, String reason);

    String getProviderName();
}
