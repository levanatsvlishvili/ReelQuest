package io.reelquest.billing.saga;

import io.reelquest.billing.cognito.EntitlementManager;
import io.reelquest.billing.gateway.CheckoutSession;
import io.reelquest.billing.gateway.CreateCheckoutRequest;
import io.reelquest.billing.gateway.PaymentGateway;
import io.reelquest.billing.gateway.WebhookEvent;
import io.reelquest.billing.repository.BillingRepository;
import io.reelquest.domain.model.Order;
import io.reelquest.domain.model.OrderStatus;
import io.reelquest.domain.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class SubscriptionSagaOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionSagaOrchestrator.class);
    private static final long PRO_MONTHLY_CENTS = 499L; // $4.99

    private final PaymentGateway paymentGateway;
    private final BillingRepository billingRepository;
    private final EntitlementManager entitlementManager;

    public SubscriptionSagaOrchestrator(
            PaymentGateway paymentGateway,
            BillingRepository billingRepository,
            EntitlementManager entitlementManager
    ) {
        this.paymentGateway = Objects.requireNonNull(paymentGateway);
        this.billingRepository = Objects.requireNonNull(billingRepository);
        this.entitlementManager = Objects.requireNonNull(entitlementManager);
    }

    public CheckoutSession startSubscriptionSaga(String userId, String email, String successUrl, String cancelUrl) {
        String timestamp = Instant.now().toString();
        String orderId = "ord_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // Step 1: Create Order in DynamoDB (Status: PENDING)
        Order order = Order.createNew(
                orderId,
                userId,
                PRO_MONTHLY_CENTS,
                "USD",
                paymentGateway.getProviderName(),
                timestamp
        );
        billingRepository.saveOrder(order);
        log.info("[SAGA Step 1] Order created: {} for user: {}", orderId, userId);

        // Step 2: Create Checkout Session via Payment Gateway
        try {
            CreateCheckoutRequest checkoutRequest = new CreateCheckoutRequest(
                    orderId,
                    userId,
                    email,
                    PRO_MONTHLY_CENTS,
                    "USD",
                    successUrl != null ? successUrl : "https://d2xe1h3gfckpcj.cloudfront.net",
                    cancelUrl != null ? cancelUrl : "https://d2xe1h3gfckpcj.cloudfront.net"
            );
            CheckoutSession session = paymentGateway.createCheckoutSession(checkoutRequest);

            Order updatedOrder = order.withCheckoutSession(session.sessionId(), Instant.now().toString());
            billingRepository.saveOrder(updatedOrder);
            log.info("[SAGA Step 2] Checkout session created: {} for order: {}", session.sessionId(), orderId);

            return session;
        } catch (Exception e) {
            log.error("[SAGA Compensation 1] Failed to create checkout session for order {}: {}", orderId, e.getMessage());
            Order cancelled = order.withCancelled("Failed to create checkout session: " + e.getMessage(), Instant.now().toString());
            billingRepository.saveOrder(cancelled);
            throw new RuntimeException("Subscription initiation failed: " + e.getMessage(), e);
        }
    }

    public boolean processWebhookSaga(String rawPayload, String signatureHeader) {
        WebhookEvent event = paymentGateway.verifyAndParseWebhook(rawPayload, signatureHeader);
        String eventId = event.eventId();

        // Idempotency: Deduplicate webhook events
        if (!billingRepository.tryAcquireWebhookLock(eventId)) {
            log.warn("[SAGA Idempotency] Webhook event {} already processed. Skipping.", eventId);
            return true;
        }

        String orderId = event.orderId();
        if (orderId == null || orderId.isBlank()) {
            log.error("Webhook event {} missing orderId", eventId);
            return false;
        }

        Optional<Order> orderOpt = billingRepository.findOrderById(orderId);
        if (orderOpt.isEmpty()) {
            log.error("Order {} not found for webhook event {}", orderId, eventId);
            return false;
        }

        Order order = orderOpt.get();
        if (order.status() == OrderStatus.COMPLETED) {
            log.info("Order {} already completed. Skipping.", orderId);
            return true;
        }

        String timestamp = Instant.now().toString();

        // Step 3: Handle Payment Failure (Compensation 1)
        if (!event.success()) {
            log.warn("[SAGA Compensation 1] Payment failed for order {}. Marking order cancelled.", orderId);
            Order failed = order.withCancelled("Payment declined or expired", timestamp);
            billingRepository.saveOrder(failed);
            return true;
        }

        // Step 4: Payment Succeeded -> Grant Pro Entitlement (Cognito + DynamoDB)
        Order orderWithPayment = order.withPaymentSuccess(event.paymentId(), timestamp);
        String usernameToGrant = order.userId();

        try {
            log.info("[SAGA Step 4] Granting PRO role to user {} in Cognito & DynamoDB", usernameToGrant);
            entitlementManager.grantProEntitlement(usernameToGrant);
            billingRepository.completeOrderAndGrantPro(orderWithPayment, timestamp);
            log.info("[SAGA Completed] Successfully upgraded user {} to PRO under order {}", order.userId(), orderId);
            return true;
        } catch (Exception e) {
            // Step 4 Compensation: Refund payment and cancel order if entitlement provisioning fails
            log.error("[SAGA Compensation 2] Entitlement grant failed for order {}: {}. Initiating refund...", orderId, e.getMessage(), e);
            try {
                paymentGateway.refundPayment(event.paymentId(), "System entitlement provisioning failure");
                Order refunded = order.withRefunded("Entitlement provisioning failure: " + e.getMessage(), Instant.now().toString());
                billingRepository.saveOrder(refunded);
                log.info("[SAGA Compensation 2] Order {} refunded successfully.", orderId);
            } catch (Exception refundEx) {
                log.error("CRITICAL: Failed to execute refund compensation for payment {}: {}", event.paymentId(), refundEx.getMessage(), refundEx);
            }
            throw new RuntimeException("Entitlement grant failed and compensation executed: " + e.getMessage(), e);
        }
    }
}
