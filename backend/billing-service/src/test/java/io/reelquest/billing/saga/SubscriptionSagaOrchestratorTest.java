package io.reelquest.billing.saga;

import io.reelquest.billing.cognito.EntitlementManager;
import io.reelquest.billing.gateway.CheckoutSession;
import io.reelquest.billing.gateway.PaymentGateway;
import io.reelquest.billing.gateway.RefundResult;
import io.reelquest.billing.gateway.WebhookEvent;
import io.reelquest.billing.repository.BillingRepository;
import io.reelquest.domain.model.Order;
import io.reelquest.domain.model.OrderStatus;
import io.reelquest.domain.model.SubscriptionTier;
import io.reelquest.domain.model.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionSagaOrchestratorTest {

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private BillingRepository billingRepository;

    @Mock
    private EntitlementManager entitlementManager;

    private SubscriptionSagaOrchestrator orchestrator;

    @BeforeEach
    void setUp() {
        orchestrator = new SubscriptionSagaOrchestrator(paymentGateway, billingRepository, entitlementManager);
    }

    @Test
    @DisplayName("Should successfully initiate subscription saga and return checkout session")
    void testStartSubscriptionSagaSuccess() {
        when(paymentGateway.getProviderName()).thenReturn("STRIPE_SANDBOX");
        when(paymentGateway.createCheckoutSession(any()))
                .thenReturn(new CheckoutSession("cs_123", "https://checkout.stripe.com/123", "STRIPE_SANDBOX"));

        CheckoutSession session = orchestrator.startSubscriptionSaga("usr_1", "cinephile@example.com", "https://app.com/success", "https://app.com/cancel");

        assertThat(session).isNotNull();
        assertThat(session.sessionId()).isEqualTo("cs_123");
        assertThat(session.checkoutUrl()).contains("checkout.stripe.com");

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(billingRepository, org.mockito.Mockito.times(2)).saveOrder(orderCaptor.capture());

        Order finalOrder = orderCaptor.getAllValues().get(1);
        assertThat(finalOrder.userId()).isEqualTo("usr_1");
        assertThat(finalOrder.status()).isEqualTo(OrderStatus.PAYMENT_INITIATED);
        assertThat(finalOrder.checkoutSessionId()).isEqualTo("cs_123");
    }

    @Test
    @DisplayName("Should complete SAGA: process successful webhook and grant Pro role in Cognito and DB")
    void testProcessWebhookSuccess() {
        String rawPayload = "{\"id\":\"evt_1\"}";
        WebhookEvent event = new WebhookEvent("evt_1", "checkout.session.completed", "ord_100", "pi_100", 499L, true, rawPayload);
        Order existingOrder = Order.createNew("ord_100", "usr_1", 499L, "USD", "STRIPE_SANDBOX", "2026-10-14T00:00:00Z");
        UserProfile profile = new UserProfile("usr_1", "NolanBuff", "nolan@buff.com", SubscriptionTier.FREE, 5, 4, 3, 2, 100L, "2026-10-10Z", "2026-10-10Z");

        when(paymentGateway.verifyAndParseWebhook(rawPayload, null)).thenReturn(event);
        when(billingRepository.tryAcquireWebhookLock("evt_1")).thenReturn(true);
        when(billingRepository.findOrderById("ord_100")).thenReturn(Optional.of(existingOrder));

        boolean processed = orchestrator.processWebhookSaga(rawPayload, null);

        assertThat(processed).isTrue();
        verify(entitlementManager).grantProEntitlement("usr_1");
        verify(billingRepository).completeOrderAndGrantPro(any(), anyString());
        verify(paymentGateway, never()).refundPayment(anyString(), anyString());
    }

    @Test
    @DisplayName("Should handle payment failure: cancel order and abort saga without granting role")
    void testProcessWebhookPaymentFailed() {
        String rawPayload = "{\"id\":\"evt_failed\"}";
        WebhookEvent event = new WebhookEvent("evt_failed", "payment_intent.payment_failed", "ord_100", "pi_fail", 499L, false, rawPayload);
        Order existingOrder = Order.createNew("ord_100", "usr_1", 499L, "USD", "STRIPE_SANDBOX", "2026-10-14T00:00:00Z");

        when(paymentGateway.verifyAndParseWebhook(rawPayload, null)).thenReturn(event);
        when(billingRepository.tryAcquireWebhookLock("evt_failed")).thenReturn(true);
        when(billingRepository.findOrderById("ord_100")).thenReturn(Optional.of(existingOrder));

        boolean processed = orchestrator.processWebhookSaga(rawPayload, null);

        assertThat(processed).isTrue();
        verify(entitlementManager, never()).grantProEntitlement(anyString());
        verify(billingRepository, never()).completeOrderAndGrantPro(any(), anyString());

        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(billingRepository).saveOrder(orderCaptor.capture());
        assertThat(orderCaptor.getValue().status()).isEqualTo(OrderStatus.CANCELLED);
    }

    @Test
    @DisplayName("SAGA Compensation: Should trigger refund and revert order if Cognito entitlement fails after payment")
    void testProcessWebhookCompensationOnCognitoFailure() {
        String rawPayload = "{\"id\":\"evt_1\"}";
        WebhookEvent event = new WebhookEvent("evt_1", "checkout.session.completed", "ord_100", "pi_100", 499L, true, rawPayload);
        Order existingOrder = Order.createNew("ord_100", "usr_1", 499L, "USD", "STRIPE_SANDBOX", "2026-10-14T00:00:00Z");
        UserProfile profile = new UserProfile("usr_1", "NolanBuff", "nolan@buff.com", SubscriptionTier.FREE, 5, 4, 3, 2, 100L, "2026-10-10Z", "2026-10-10Z");

        when(paymentGateway.verifyAndParseWebhook(rawPayload, null)).thenReturn(event);
        when(billingRepository.tryAcquireWebhookLock("evt_1")).thenReturn(true);
        when(billingRepository.findOrderById("ord_100")).thenReturn(Optional.of(existingOrder));
        when(paymentGateway.refundPayment(eq("pi_100"), anyString())).thenReturn(RefundResult.success("re_123", "pi_100"));

        org.mockito.Mockito.doThrow(new RuntimeException("Cognito rate limit exceeded"))
                .when(entitlementManager).grantProEntitlement("usr_1");

        assertThatThrownBy(() -> orchestrator.processWebhookSaga(rawPayload, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Entitlement grant failed and compensation executed");

        // Verify compensating refund was called
        verify(paymentGateway).refundPayment(eq("pi_100"), anyString());

        // Verify order was saved as REFUNDED
        ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
        verify(billingRepository).saveOrder(orderCaptor.capture());
        assertThat(orderCaptor.getValue().status()).isEqualTo(OrderStatus.REFUNDED);
    }

    @Test
    @DisplayName("Should gracefully skip duplicate webhook events (Idempotency)")
    void testProcessWebhookDuplicateEvent() {
        when(paymentGateway.verifyAndParseWebhook(anyString(), any()))
                .thenReturn(new WebhookEvent("evt_duplicate", "checkout.session.completed", "ord_100", "pi_100", 499L, true, "{}"));
        when(billingRepository.tryAcquireWebhookLock("evt_duplicate")).thenReturn(false);

        boolean processed = orchestrator.processWebhookSaga("{}", null);

        assertThat(processed).isTrue();
        verify(billingRepository, never()).findOrderById(anyString());
        verify(entitlementManager, never()).grantProEntitlement(anyString());
    }
}
