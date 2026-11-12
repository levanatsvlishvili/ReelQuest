package io.reelquest.billing.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.reelquest.billing.cognito.AwsCognitoEntitlementManager;
import io.reelquest.billing.cognito.EntitlementManager;
import io.reelquest.billing.gateway.CheckoutSession;
import io.reelquest.billing.gateway.PaymentGateway;
import io.reelquest.billing.gateway.StripeSandboxPaymentGateway;
import io.reelquest.billing.repository.BillingRepository;
import io.reelquest.billing.saga.SubscriptionSagaOrchestrator;
import io.reelquest.domain.model.Order;
import io.reelquest.domain.model.SubscriptionTier;
import io.reelquest.domain.model.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.cognitoidentityprovider.CognitoIdentityProviderClient;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminAddUserToGroupRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminCreateUserRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AdminSetUserPasswordRequest;
import software.amazon.awssdk.services.cognitoidentityprovider.model.AttributeType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.MessageActionType;
import software.amazon.awssdk.services.cognitoidentityprovider.model.UsernameExistsException;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

public class BillingApiHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger log = LoggerFactory.getLogger(BillingApiHandler.class);
    private static final String DEFAULT_TABLE = "reelquest-dev-data";

    private final ObjectMapper objectMapper;
    private final BillingRepository billingRepository;
    private final PaymentGateway paymentGateway;
    private final EntitlementManager entitlementManager;
    private final SubscriptionSagaOrchestrator sagaOrchestrator;
    private final CognitoIdentityProviderClient cognitoClient;
    private final String userPoolId;

    public BillingApiHandler() {
        this.objectMapper = new ObjectMapper();
        String regionStr = System.getenv().getOrDefault("AWS_REGION", "eu-central-1");
        String tableName = System.getenv().getOrDefault("DYNAMODB_TABLE", DEFAULT_TABLE);
        this.userPoolId = System.getenv().getOrDefault("COGNITO_USER_POOL_ID", "");

        Region region = Region.of(regionStr);
        DynamoDbClient dynamoDbClient = DynamoDbClient.builder().region(region).build();
        this.cognitoClient = CognitoIdentityProviderClient.builder().region(region).build();

        this.billingRepository = new BillingRepository(dynamoDbClient, tableName);
        this.paymentGateway = new StripeSandboxPaymentGateway();
        this.entitlementManager = new AwsCognitoEntitlementManager(cognitoClient, userPoolId);
        this.sagaOrchestrator = new SubscriptionSagaOrchestrator(paymentGateway, billingRepository, entitlementManager);
    }

    public BillingApiHandler(
            BillingRepository billingRepository,
            PaymentGateway paymentGateway,
            EntitlementManager entitlementManager,
            SubscriptionSagaOrchestrator sagaOrchestrator
    ) {
        this.objectMapper = new ObjectMapper();
        this.billingRepository = billingRepository;
        this.paymentGateway = paymentGateway;
        this.entitlementManager = entitlementManager;
        this.sagaOrchestrator = sagaOrchestrator;
        this.cognitoClient = null;
        this.userPoolId = "";
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        String httpMethod = request.getHttpMethod();
        String path = request.getPath() != null ? request.getPath() : "";

        if ("OPTIONS".equalsIgnoreCase(httpMethod)) {
            return response(200, Map.of("status", "OK"));
        }

        try {
            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/billing/checkout")) {
                return handleCheckout(request);
            }

            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/billing/webhook")) {
                return handleWebhook(request);
            }

            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/billing/simulate-webhook")) {
                return handleSimulateWebhook(request);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.matches(".*/billing/orders/[^/]+/?$")) {
                String orderId = path.replaceAll(".*/billing/orders/([^/]+)/?$", "$1");
                return handleGetOrder(orderId);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.matches(".*/users/[^/]+/?$")) {
                String userId = path.replaceAll(".*/users/([^/]+)/?$", "$1");
                return handleGetUser(userId);
            }

            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/users/sync")) {
                return handleSyncUser(request);
            }

            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/users/migrate-cognito")) {
                return handleMigrateCognito(request);
            }

            return response(404, Map.of("error", "Resource not found", "path", path));
        } catch (Exception e) {
            log.error("Unhandled error processing {}: {}", path, e.getMessage(), e);
            return response(500, Map.of("error", "Internal error: " + e.getMessage()));
        }
    }

    private APIGatewayProxyResponseEvent handleCheckout(APIGatewayProxyRequestEvent request) throws Exception {
        JsonNode root = objectMapper.readTree(request.getBody());
        String userId = root.path("userId").asText();
        String email = root.path("email").asText();
        String successUrl = root.path("successUrl").asText(null);
        String cancelUrl = root.path("cancelUrl").asText(null);

        if (userId.isBlank() || email.isBlank()) {
            return response(400, Map.of("error", "'userId' and 'email' are required."));
        }

        CheckoutSession session = sagaOrchestrator.startSubscriptionSaga(userId, email, successUrl, cancelUrl);
        return response(200, session);
    }

    private APIGatewayProxyResponseEvent handleWebhook(APIGatewayProxyRequestEvent request) {
        String signature = getHeader(request, "Stripe-Signature");
        String payload = request.getBody() != null ? request.getBody() : "{}";

        boolean success = sagaOrchestrator.processWebhookSaga(payload, signature);
        if (success) {
            return response(200, Map.of("status", "received"));
        } else {
            return response(400, Map.of("error", "Failed to process webhook"));
        }
    }

    private APIGatewayProxyResponseEvent handleSimulateWebhook(APIGatewayProxyRequestEvent request) throws Exception {
        JsonNode root = objectMapper.readTree(request.getBody());
        String orderId = root.path("orderId").asText();
        boolean success = root.path("success").asBoolean(true);

        if (orderId.isBlank()) {
            return response(400, Map.of("error", "'orderId' is required."));
        }

        if (paymentGateway instanceof StripeSandboxPaymentGateway sandboxGateway) {
            String simulatedPayload = sandboxGateway.createSimulatedWebhookPayload(orderId, success);
            boolean processed = sagaOrchestrator.processWebhookSaga(simulatedPayload, null);
            return response(200, Map.of(
                    "status", processed ? "SUCCESS" : "FAILED",
                    "orderId", orderId,
                    "simulatedSuccess", success
            ));
        }

        return response(400, Map.of("error", "Active gateway does not support webhook simulation"));
    }

    private APIGatewayProxyResponseEvent handleGetOrder(String orderId) {
        Optional<Order> order = billingRepository.findOrderById(orderId);
        if (order.isEmpty()) {
            return response(404, Map.of("error", "Order not found", "orderId", orderId));
        }
        return response(200, order.get());
    }

    private APIGatewayProxyResponseEvent handleGetUser(String userId) {
        Optional<UserProfile> profile = billingRepository.findUserProfile(userId);
        if (profile.isEmpty()) {
            UserProfile defaultProfile = UserProfile.createDefault(userId, userId, userId + "@reelquest.io", Instant.now().toString());
            return response(200, defaultProfile);
        }
        return response(200, profile.get());
    }

    private APIGatewayProxyResponseEvent handleSyncUser(APIGatewayProxyRequestEvent request) throws Exception {
        JsonNode root = objectMapper.readTree(request.getBody());
        String userId = root.path("userId").asText();
        String username = root.path("username").asText(userId);
        String email = root.path("email").asText(userId + "@reelquest.io");
        boolean isPro = root.path("isPro").asBoolean(false);

        if (userId.isBlank()) {
            return response(400, Map.of("error", "'userId' is required."));
        }

        String timestamp = Instant.now().toString();
        Optional<UserProfile> existing = billingRepository.findUserProfile(userId);
        UserProfile profile;

        if (existing.isPresent()) {
            UserProfile current = existing.get();
            SubscriptionTier targetTier = isPro ? SubscriptionTier.PRO : current.tier();
            String resolvedName = (username != null && !username.isBlank() && !username.equals(userId))
                    ? username
                    : current.username();
            String resolvedEmail = (email != null && !email.isBlank() && !email.endsWith("@reelquest.io"))
                    ? email
                    : current.email();
            profile = new UserProfile(
                    userId,
                    resolvedName,
                    resolvedEmail,
                    targetTier,
                    current.gamesPlayed(),
                    current.gamesWon(),
                    current.streak(),
                    current.bestHops(),
                    current.totalScore(),
                    current.createdAt(),
                    timestamp
            );
        } else {
            profile = new UserProfile(
                    userId,
                    username,
                    email,
                    isPro ? SubscriptionTier.PRO : SubscriptionTier.FREE,
                    0, 0, 0, 0, 0L,
                    timestamp, timestamp
            );
        }

        billingRepository.saveUserProfile(profile);
        return response(200, profile);
    }

    private APIGatewayProxyResponseEvent handleMigrateCognito(APIGatewayProxyRequestEvent request) throws Exception {
        if (cognitoClient == null || userPoolId == null || userPoolId.isBlank()) {
            return response(400, Map.of("error", "Cognito migration not configured"));
        }

        JsonNode root = objectMapper.readTree(request.getBody());
        String email = root.path("email").asText("").trim();
        String password = root.path("password").asText("");
        String username = root.path("username").asText(email.contains("@") ? email.split("@")[0] : "Cinephile");

        if (email.isBlank() || password.isBlank()) {
            return response(400, Map.of("error", "email and password are required"));
        }

        try {
            cognitoClient.adminCreateUser(AdminCreateUserRequest.builder()
                    .userPoolId(userPoolId)
                    .username(email)
                    .messageAction(MessageActionType.SUPPRESS)
                    .userAttributes(
                            AttributeType.builder().name("email").value(email).build(),
                            AttributeType.builder().name("email_verified").value("true").build(),
                            AttributeType.builder().name("nickname").value(username).build()
                    )
                    .build());
        } catch (UsernameExistsException ignored) {}

        cognitoClient.adminSetUserPassword(AdminSetUserPasswordRequest.builder()
                .userPoolId(userPoolId)
                .username(email)
                .password(password)
                .permanent(true)
                .build());

        if ("levani28100@gmail.com".equalsIgnoreCase(email) || email.toLowerCase().contains("admin")) {
            try {
                cognitoClient.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                        .userPoolId(userPoolId)
                        .username(email)
                        .groupName("Admins")
                        .build());
            } catch (Exception ignored) {}
        }

        if (root.has("groups") && root.get("groups").isArray()) {
            for (JsonNode g : root.get("groups")) {
                String gName = g.asText("");
                if (!gName.isBlank()) {
                    try {
                        cognitoClient.adminAddUserToGroup(AdminAddUserToGroupRequest.builder()
                                .userPoolId(userPoolId)
                                .username(email)
                                .groupName(gName)
                                .build());
                    } catch (Exception ignored) {}
                }
            }
        }

        return response(200, Map.of("migrated", true, "email", email));
    }

    private String getHeader(APIGatewayProxyRequestEvent request, String headerName) {
        if (request.getHeaders() == null) return null;
        for (Map.Entry<String, String> entry : request.getHeaders().entrySet()) {
            if (entry.getKey().equalsIgnoreCase(headerName)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private APIGatewayProxyResponseEvent response(int statusCode, Object body) {
        try {
            String json = objectMapper.writeValueAsString(body);
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(statusCode)
                    .withHeaders(Map.of(
                            "Content-Type", "application/json",
                            "Access-Control-Allow-Origin", "*",
                            "Access-Control-Allow-Methods", "GET, POST, OPTIONS",
                            "Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, Authorization, Stripe-Signature"
                    ))
                    .withBody(json);
        } catch (Exception e) {
            return new APIGatewayProxyResponseEvent()
                    .withStatusCode(500)
                    .withBody("{\"error\":\"Serialization failed\"}");
        }
    }
}
