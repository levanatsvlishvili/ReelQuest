package io.reelquest.billing.handler;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.reelquest.billing.cognito.EntitlementManager;
import io.reelquest.billing.gateway.CheckoutSession;
import io.reelquest.billing.gateway.PaymentGateway;
import io.reelquest.billing.repository.BillingRepository;
import io.reelquest.billing.saga.SubscriptionSagaOrchestrator;
import io.reelquest.domain.model.Order;
import io.reelquest.domain.model.OrderStatus;
import io.reelquest.domain.model.SubscriptionTier;
import io.reelquest.domain.model.UserProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BillingApiHandlerTest {

    @Mock
    private BillingRepository billingRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private EntitlementManager entitlementManager;

    @Mock
    private SubscriptionSagaOrchestrator sagaOrchestrator;

    private BillingApiHandler handler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        handler = new BillingApiHandler(billingRepository, paymentGateway, entitlementManager, sagaOrchestrator);
    }

    @Test
    @DisplayName("Should return 200 for OPTIONS preflight")
    void testOptionsPreflight() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("OPTIONS")
                .withPath("/billing/checkout");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getHeaders()).containsKey("Access-Control-Allow-Origin");
    }

    @Test
    @DisplayName("Should initiate checkout and return session")
    void testCheckoutSuccess() throws Exception {
        CheckoutSession session = new CheckoutSession("cs_test_abc", "https://checkout.stripe.com/pay/abc", "STRIPE_SANDBOX");
        when(sagaOrchestrator.startSubscriptionSaga(eq("usr_123"), eq("cinephile@test.com"), any(), any()))
                .thenReturn(session);

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/billing/checkout")
                .withBody(objectMapper.writeValueAsString(java.util.Map.of(
                        "userId", "usr_123",
                        "email", "cinephile@test.com"
                )));

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("cs_test_abc");
    }

    @Test
    @DisplayName("Should fetch user profile by ID")
    void testGetUserProfile() {
        UserProfile profile = new UserProfile(
                "usr_999", "TarantinoFan", "qt@test.com", SubscriptionTier.PRO,
                10, 8, 5, 2, 850L, "2026-10-10", "2026-10-14"
        );
        when(billingRepository.findUserProfile("usr_999")).thenReturn(Optional.of(profile));

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/users/usr_999");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("TarantinoFan");
        assertThat(response.getBody()).contains("PRO");
    }

    @Test
    @DisplayName("Should sync and save user profile upon login")
    void testSyncUserProfile() throws Exception {
        when(billingRepository.findUserProfile("usr_123")).thenReturn(Optional.empty());

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/users/sync")
                .withBody(objectMapper.writeValueAsString(java.util.Map.of(
                        "userId", "usr_123",
                        "username", "ScorseseBuff",
                        "email", "martin@buff.com",
                        "isPro", true
                )));

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("ScorseseBuff");
        assertThat(response.getBody()).contains("PRO");
        verify(billingRepository).saveUserProfile(any());
    }

    @Test
    @DisplayName("Should fetch order details by orderId")
    void testGetOrder() {
        Order order = new Order("ord_123", "usr_1", 499L, "USD", OrderStatus.COMPLETED, "STRIPE_SANDBOX", "cs_1", "pi_1", "2026-10-14", "2026-10-14", null);
        when(billingRepository.findOrderById("ord_123")).thenReturn(Optional.of(order));

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/billing/orders/ord_123");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("ord_123");
        assertThat(response.getBody()).contains("COMPLETED");
    }
}
