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
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GameApiHandlerTest {

    private InMemoryGraphDataProvider dataProvider;
    private BidirectionalBfsFinder bfsFinder;
    private GameSessionValidator validator;
    private TestIdempotencyService idempotencyService;
    private DailyChallengeService dailyService;
    private GameApiHandler handler;

    @BeforeEach
    void setUp() {
        dataProvider = new InMemoryGraphDataProvider();
        bfsFinder = new BidirectionalBfsFinder(dataProvider);
        validator = new GameSessionValidator(dataProvider);
        idempotencyService = new TestIdempotencyService();
        dailyService = new DailyChallengeService(dataProvider, bfsFinder);

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
                null,
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
