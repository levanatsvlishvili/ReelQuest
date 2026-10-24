package io.reelquest.game.handler;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import io.reelquest.domain.game.GameSessionValidator;
import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.InMemoryGraphDataProvider;
import io.reelquest.domain.idempotency.IdempotencyRecord;
import io.reelquest.domain.idempotency.IdempotencyService;
import io.reelquest.domain.idempotency.IdempotencyStatus;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemResponse;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemResponse;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;

class GameApiHandlerTest {

    private InMemoryGraphDataProvider dataProvider;
    private BidirectionalBfsFinder bfsFinder;
    private GameSessionValidator validator;
    private TestIdempotencyService idempotencyService;
    private DailyChallengeService dailyService;
    private DynamoDbClient dynamoDbClient;
    private Map<String, Map<String, AttributeValue>> mockDb;
    private GameApiHandler handler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        dataProvider = new InMemoryGraphDataProvider();
        bfsFinder = new BidirectionalBfsFinder(dataProvider);
        validator = new GameSessionValidator(dataProvider);
        idempotencyService = new TestIdempotencyService();
        dailyService = new DailyChallengeService(dataProvider, bfsFinder);
        mockDb = new HashMap<>();

        dynamoDbClient = mock(DynamoDbClient.class);

        doAnswer(inv -> {
            PutItemRequest req = inv.getArgument(0);
            String pk = req.item().get("PK").s();
            mockDb.put(pk, new HashMap<>(req.item()));
            return PutItemResponse.builder().build();
        }).when(dynamoDbClient).putItem(any(PutItemRequest.class));

        doAnswer(inv -> {
            GetItemRequest req = inv.getArgument(0);
            String pk = req.key().get("PK").s();
            Map<String, AttributeValue> item = mockDb.get(pk);
            if (item != null) {
                return GetItemResponse.builder().item(item).build();
            }
            return GetItemResponse.builder().build();
        }).when(dynamoDbClient).getItem(any(GetItemRequest.class));

        doAnswer(inv -> {
            UpdateItemRequest req = inv.getArgument(0);
            String pk = req.key().get("PK").s();
            Map<String, AttributeValue> item = mockDb.computeIfAbsent(pk, k -> new HashMap<>());
            if (req.expressionAttributeValues() != null) {
                req.expressionAttributeValues().forEach((k, v) -> {
                    if (":gUid".equals(k)) item.put("guestUserId", v);
                    if (":gName".equals(k)) item.put("guestUsername", v);
                    if (":st".equals(k)) item.put("status", v);
                    if (":now".equals(k)) item.put("updatedAt", v);
                });
            }
            return UpdateItemResponse.builder().attributes(item).build();
        }).when(dynamoDbClient).updateItem(any(UpdateItemRequest.class));

        dataProvider.addActor(new Actor("31", "Tom Hanks", 95.0, null));
        dataProvider.addActor(new Actor("6193", "Leonardo DiCaprio", 98.0, null));
        dataProvider.addActor(new Actor("nm0000158", "Tom Hanks", 95.0, null));
        dataProvider.addActor(new Actor("nm0000138", "Leonardo DiCaprio", 98.0, null));
        dataProvider.addMovie(new Movie("m_catch", "Catch Me If You Can", 2002, 8.1, null, 100));
        dataProvider.addEdge("31", "m_catch", "Carl", 1);
        dataProvider.addEdge("6193", "m_catch", "Frank", 2);
        dataProvider.addEdge("nm0000158", "m_catch", "Carl", 1);
        dataProvider.addEdge("nm0000138", "m_catch", "Frank", 2);

        handler = new GameApiHandler(
                dynamoDbClient,
                "test-table",
                dataProvider,
                bfsFinder,
                validator,
                idempotencyService,
                dailyService
        );
    }

    @Test
    @DisplayName("GET /api/v1/daily should return valid daily challenge")
    void shouldReturnDailyChallenge() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/api/v1/daily");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("startActor");
        assertThat(response.getBody()).contains("targetActor");
    }

    @Test
    @DisplayName("GET /api/v1/shortest-path should compute shortest path")
    void shouldReturnShortestPath() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/api/v1/shortest-path")
                .withQueryStringParameters(Map.of("start", "nm0000158", "target", "nm0000138"));

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("\"degrees\":1");
    }

    @Test
    @DisplayName("POST /api/v1/games/submit without Idempotency-Key should return 400")
    void shouldRejectSubmissionWithoutIdempotencyKey() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/api/v1/games/submit")
                .withBody("{}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(400);
        assertThat(response.getBody()).contains("Idempotency-Key");
    }

    @Test
    @DisplayName("POST /api/v1/games/submit without authentication should return 401")
    void shouldRejectSubmissionWithoutAuthentication() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/api/v1/games/submit")
                .withHeaders(Map.of("Idempotency-Key", "test-key-auth"))
                .withBody("{}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(401);
        assertThat(response.getBody()).contains("Unauthorized");
    }

    @Test
    @DisplayName("POST /api/v1/games/submit with duplicate key should return cached response")
    void shouldReturnCachedResponseOnDuplicateIdempotencyKey() {
        String key = "test-idem-key-123";
        idempotencyService.store.put(key, new IdempotencyRecord(key, IdempotencyStatus.COMPLETED, "{\"cached\":true}", 12345));

        APIGatewayProxyRequestEvent.ProxyRequestContext requestContext = new APIGatewayProxyRequestEvent.ProxyRequestContext();
        requestContext.setAuthorizer(Map.of("claims", Map.of("sub", "user-123", "nickname", "TestUser")));

        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/api/v1/games/submit")
                .withHeaders(Map.of("Idempotency-Key", key))
                .withRequestContext(requestContext)
                .withBody("{}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("{\"cached\":true}");
    }

    @Test
    @DisplayName("GET /actors/{actorId}/movies should return filmography")
    void shouldReturnActorMovies() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/actors/31/movies");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("Catch Me If You Can");
    }

    @Test
    @DisplayName("GET /movies/{movieId}/cast should return movie cast")
    void shouldReturnMovieCast() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/movies/m_catch/cast");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(200);
        assertThat(response.getBody()).contains("Tom Hanks");
        assertThat(response.getBody()).contains("Leonardo DiCaprio");
    }

    @Test
    @DisplayName("POST /duels/create should create a new duel lobby")
    void shouldCreateDuelLobby() {
        APIGatewayProxyRequestEvent request = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"CineMaster\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");

        APIGatewayProxyResponseEvent response = handler.handleRequest(request, null);

        assertThat(response.getStatusCode()).isEqualTo(201);
        assertThat(response.getBody()).contains("\"status\":\"WAITING\"");
        assertThat(response.getBody()).contains("\"hostUsername\":\"CineMaster\"");
        assertThat(response.getBody()).contains("\"optimalHops\":1");
    }

    @Test
    @DisplayName("GET /duels/{duelId} should return duel details or 404 if not found")
    void shouldGetDuelById() {
        APIGatewayProxyRequestEvent notFoundReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/duels/non-existent-id")
                .withPathParameters(Map.of("duelId", "non-existent-id"));

        APIGatewayProxyResponseEvent notFoundRes = handler.handleRequest(notFoundReq, null);
        assertThat(notFoundRes.getStatusCode()).isEqualTo(404);

        // Create duel first
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"CineMaster\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");
        APIGatewayProxyResponseEvent createRes = handler.handleRequest(createReq, null);
        assertThat(createRes.getStatusCode()).isEqualTo(201);

        String duelId = mockDb.keySet().stream()
                .map(pk -> pk.replace("DUEL#", ""))
                .findFirst()
                .orElseThrow();

        APIGatewayProxyRequestEvent getReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("GET")
                .withPath("/duels/" + duelId)
                .withPathParameters(Map.of("duelId", duelId));

        APIGatewayProxyResponseEvent getRes = handler.handleRequest(getReq, null);
        assertThat(getRes.getStatusCode()).isEqualTo(200);
        assertThat(getRes.getBody()).contains(duelId);
        assertThat(getRes.getBody()).contains("\"status\":\"WAITING\"");
    }

    @Test
    @DisplayName("POST /duels/{duelId}/join should allow guest to join and transition status to IN_PROGRESS")
    void shouldJoinDuelSuccessfully() {
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"HostGuy\"}");
        handler.handleRequest(createReq, null);

        String duelId = mockDb.keySet().stream()
                .map(pk -> pk.replace("DUEL#", ""))
                .findFirst()
                .orElseThrow();

        APIGatewayProxyRequestEvent joinReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/join")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"guestUserId\":\"guest-999\",\"guestUsername\":\"OpponentChallenger\"}");

        APIGatewayProxyResponseEvent joinRes = handler.handleRequest(joinReq, null);
        assertThat(joinRes.getStatusCode()).isEqualTo(200);
        assertThat(joinRes.getBody()).contains("\"status\":\"IN_PROGRESS\"");
        assertThat(joinRes.getBody()).contains("\"guestUsername\":\"OpponentChallenger\"");
    }

    @Test
    @DisplayName("POST /duels/{duelId}/submit should compute winner based on lowest moves")
    void shouldSubmitScoresAndDetermineHostWinsOnFewerMoves() throws Exception {
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"HostGuy\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");
        APIGatewayProxyResponseEvent createRes = handler.handleRequest(createReq, null);
        Map<?, ?> createdBody = objectMapper.readValue(createRes.getBody(), Map.class);
        String duelId = (String) createdBody.get("duelId");
        String hostUserId = (String) createdBody.get("hostUserId");

        // Guest joins
        APIGatewayProxyRequestEvent joinReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/join")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"guestUserId\":\"guest-777\",\"guestUsername\":\"GuestGirl\"}");
        handler.handleRequest(joinReq, null);

        // Host submits score: 2 moves, 40s
        APIGatewayProxyRequestEvent hostSubmit = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/submit")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"playerId\":\"" + hostUserId + "\",\"moves\":2,\"durationSeconds\":40,\"won\":true}");
        APIGatewayProxyResponseEvent hostSubmitRes = handler.handleRequest(hostSubmit, null);
        assertThat(hostSubmitRes.getStatusCode()).isEqualTo(200);
        assertThat(hostSubmitRes.getBody()).contains("\"status\":\"IN_PROGRESS\"");
        assertThat(hostSubmitRes.getBody()).contains("\"hostMoves\":2");

        // Guest submits score: 3 moves, 30s
        APIGatewayProxyRequestEvent guestSubmit = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/submit")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"playerId\":\"guest-777\",\"moves\":3,\"durationSeconds\":30,\"won\":true}");
        APIGatewayProxyResponseEvent guestSubmitRes = handler.handleRequest(guestSubmit, null);
        assertThat(guestSubmitRes.getStatusCode()).isEqualTo(200);
        assertThat(guestSubmitRes.getBody()).contains("\"status\":\"COMPLETED\"");
        assertThat(guestSubmitRes.getBody()).contains("\"winnerId\":\"" + hostUserId + "\"");
    }

    @Test
    @DisplayName("POST /duels/{duelId}/submit with tied moves should break tie by lowest duration")
    void shouldDetermineWinnerByDurationOnTiedMoves() throws Exception {
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"HostGuy\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");
        APIGatewayProxyResponseEvent createRes = handler.handleRequest(createReq, null);
        Map<?, ?> createdBody = objectMapper.readValue(createRes.getBody(), Map.class);
        String duelId = (String) createdBody.get("duelId");
        String hostUserId = (String) createdBody.get("hostUserId");

        // Guest joins
        APIGatewayProxyRequestEvent joinReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/join")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"guestUserId\":\"speedy-guest\",\"guestUsername\":\"SpeedyGuest\"}");
        handler.handleRequest(joinReq, null);

        // Host submits: 2 moves, 60s
        APIGatewayProxyRequestEvent hostSubmit = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/submit")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"playerId\":\"" + hostUserId + "\",\"moves\":2,\"durationSeconds\":60,\"won\":true}");
        handler.handleRequest(hostSubmit, null);

        // Guest submits: 2 moves, 45s (faster!)
        APIGatewayProxyRequestEvent guestSubmit = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/submit")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"playerId\":\"speedy-guest\",\"moves\":2,\"durationSeconds\":45,\"won\":true}");
        APIGatewayProxyResponseEvent guestSubmitRes = handler.handleRequest(guestSubmit, null);
        assertThat(guestSubmitRes.getStatusCode()).isEqualTo(200);
        assertThat(guestSubmitRes.getBody()).contains("\"status\":\"COMPLETED\"");
        assertThat(guestSubmitRes.getBody()).contains("\"winnerId\":\"speedy-guest\"");
    }

    @Test
    @DisplayName("POST /duels/{duelId}/progress should update live opponent telemetry and emotes")
    void shouldUpdateLiveDuelProgress() throws Exception {
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"HostGuy\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");
        APIGatewayProxyResponseEvent createRes = handler.handleRequest(createReq, null);
        Map<?, ?> createdBody = objectMapper.readValue(createRes.getBody(), Map.class);
        String duelId = (String) createdBody.get("duelId");

        APIGatewayProxyRequestEvent progressReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/progress")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"role\":\"HOST\",\"currentMoves\":1,\"currentActorName\":\"Leonardo DiCaprio\",\"lastAction\":\"Linked via Catch Me If You Can\",\"emote\":\"🔥\"}");

        APIGatewayProxyResponseEvent progressRes = handler.handleRequest(progressReq, null);
        assertThat(progressRes.getStatusCode()).isEqualTo(200);
        assertThat(progressRes.getBody()).contains("\"hostLiveMoves\":1");
        assertThat(progressRes.getBody()).contains("\"hostCurrentActor\":\"Leonardo DiCaprio\"");
        assertThat(progressRes.getBody()).contains("\"hostLastAction\":\"Linked via Catch Me If You Can\"");
        assertThat(progressRes.getBody()).contains("\"hostEmote\":\"🔥\"");
    }

    @Test
    @DisplayName("POST /duels/{duelId}/rematch should create linked rematch duel with both players ready")
    void shouldCreateRematchDuel() throws Exception {
        APIGatewayProxyRequestEvent createReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/create")
                .withBody("{\"hostNickname\":\"HostGuy\",\"startActorId\":\"31\",\"targetActorId\":\"6193\"}");
        APIGatewayProxyResponseEvent createRes = handler.handleRequest(createReq, null);
        Map<?, ?> createdBody = objectMapper.readValue(createRes.getBody(), Map.class);
        String duelId = (String) createdBody.get("duelId");

        // Guest joins
        APIGatewayProxyRequestEvent joinReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/join")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{\"guestUserId\":\"guest-100\",\"guestUsername\":\"RivalStar\"}");
        handler.handleRequest(joinReq, null);

        // Request rematch
        APIGatewayProxyRequestEvent rematchReq = new APIGatewayProxyRequestEvent()
                .withHttpMethod("POST")
                .withPath("/duels/" + duelId + "/rematch")
                .withPathParameters(Map.of("duelId", duelId))
                .withBody("{}");
        APIGatewayProxyResponseEvent rematchRes = handler.handleRequest(rematchReq, null);
        assertThat(rematchRes.getStatusCode()).isEqualTo(201);
        assertThat(rematchRes.getBody()).contains("\"status\":\"IN_PROGRESS\"");
        assertThat(rematchRes.getBody()).contains("\"hostUsername\":\"HostGuy\"");
        assertThat(rematchRes.getBody()).contains("\"guestUsername\":\"RivalStar\"");
    }

    private static class TestIdempotencyService implements IdempotencyService {
        final Map<String, IdempotencyRecord> store = new HashMap<>();

        @Override
        public boolean tryAcquireLock(String idempotencyKey, Duration ttl) {
            if (store.containsKey(idempotencyKey)) {
                return false;
            }
            store.put(idempotencyKey, new IdempotencyRecord(idempotencyKey, IdempotencyStatus.IN_PROGRESS, null, 0));
            return true;
        }

        @Override
        public Optional<IdempotencyRecord> getRecord(String idempotencyKey) {
            return Optional.ofNullable(store.get(idempotencyKey));
        }

        @Override
        public void markCompleted(String idempotencyKey, String responseBody) {
            store.put(idempotencyKey, new IdempotencyRecord(idempotencyKey, IdempotencyStatus.COMPLETED, responseBody, 0));
        }
    }
}
