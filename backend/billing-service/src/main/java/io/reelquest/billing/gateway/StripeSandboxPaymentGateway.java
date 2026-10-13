package io.reelquest.billing.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;

public class StripeSandboxPaymentGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(StripeSandboxPaymentGateway.class);
    private final ObjectMapper objectMapper;
    private final String secretKey;

    public StripeSandboxPaymentGateway() {
        this.objectMapper = new ObjectMapper();
        this.secretKey = System.getenv().getOrDefault("STRIPE_SECRET_KEY", "sandbox_key");
    }

    public StripeSandboxPaymentGateway(String secretKey, ObjectMapper objectMapper) {
        this.secretKey = secretKey;
        this.objectMapper = objectMapper;
    }

    @Override
    public CheckoutSession createCheckoutSession(CreateCheckoutRequest request) {
        String sessionId = "cs_test_" + UUID.randomUUID().toString().replace("-", "");
        String checkoutUrl = request.successUrl() + "?session_id=" + sessionId + "&order_id=" + request.orderId();
        
        log.info("Created Stripe Sandbox Checkout Session {} for order {}", sessionId, request.orderId());
        return new CheckoutSession(sessionId, checkoutUrl, getProviderName(), request.orderId());
    }

    @Override
    public WebhookEvent verifyAndParseWebhook(String rawPayload, String signatureHeader) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);
            String eventId = root.has("id") ? root.get("id").asText() : "evt_" + UUID.randomUUID();
            String eventType = root.has("type") ? root.get("type").asText() : "checkout.session.completed";

            JsonNode dataObject = root.path("data").path("object");
            String orderId = dataObject.path("metadata").path("orderId").asText(
                    dataObject.path("client_reference_id").asText(root.path("orderId").asText(""))
            );
            String paymentId = dataObject.path("payment_intent").asText(
                    dataObject.path("id").asText("pi_test_" + UUID.randomUUID())
            );
            long amountCents = dataObject.path("amount_total").asLong(
                    root.path("amountCents").asLong(499L)
            );

            boolean success = "checkout.session.completed".equalsIgnoreCase(eventType)
                    || "payment_intent.succeeded".equalsIgnoreCase(eventType);

            return new WebhookEvent(eventId, eventType, orderId, paymentId, amountCents, success, rawPayload);
        } catch (Exception e) {
            log.error("Failed to parse webhook payload: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Invalid webhook payload: " + e.getMessage(), e);
        }
    }

    @Override
    public RefundResult refundPayment(String paymentId, String reason) {
        String refundId = "re_test_" + UUID.randomUUID().toString().replace("-", "");
        log.info("Stripe Sandbox: processed refund {} for payment {} (reason: {})", refundId, paymentId, reason);
        return RefundResult.success(refundId, paymentId);
    }

    @Override
    public String getProviderName() {
        return "STRIPE_SANDBOX";
    }

    public String createSimulatedWebhookPayload(String orderId, boolean success) {
        try {
            String eventType = success ? "checkout.session.completed" : "payment_intent.payment_failed";
            return objectMapper.writeValueAsString(java.util.Map.of(
                    "id", "evt_sim_" + UUID.randomUUID(),
                    "type", eventType,
                    "orderId", orderId,
                    "data", java.util.Map.of(
                            "object", java.util.Map.of(
                                    "id", "cs_sim_" + UUID.randomUUID(),
                                    "payment_intent", "pi_sim_" + UUID.randomUUID(),
                                    "amount_total", 499,
                                    "client_reference_id", orderId,
                                    "metadata", java.util.Map.of("orderId", orderId)
                            )
                    )
            ));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
