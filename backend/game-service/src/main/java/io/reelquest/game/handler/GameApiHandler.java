package io.reelquest.game.handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.reelquest.domain.game.GameSessionValidator;
import io.reelquest.domain.game.GameSubmission;
import io.reelquest.domain.game.ValidationResult;
import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.DynamoDbGraphDataProvider;
import io.reelquest.domain.graph.GraphDataProvider;
import io.reelquest.domain.graph.ShortestPathResult;
import io.reelquest.domain.idempotency.DynamoDbIdempotencyService;
import io.reelquest.domain.idempotency.IdempotencyRecord;
import io.reelquest.domain.idempotency.IdempotencyService;
import io.reelquest.domain.idempotency.IdempotencyStatus;
import io.reelquest.game.dto.DailyChallengeResponse;
import io.reelquest.game.dto.LeaderboardEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.Put;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItemsRequest;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class GameApiHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final Logger log = LoggerFactory.getLogger(GameApiHandler.class);
    private static final String DEFAULT_TABLE = "reelquest-dev-data";

    private final ObjectMapper objectMapper;
    private final DynamoDbClient dynamoDbClient;
    private final String tableName;
    private final GraphDataProvider dataProvider;
    private final BidirectionalBfsFinder bfsFinder;
    private final GameSessionValidator validator;
    private final IdempotencyService idempotencyService;
    private final DailyChallengeService dailyService;

    public GameApiHandler() {
        this.objectMapper = new ObjectMapper();
        String regionStr = System.getenv().getOrDefault("AWS_REGION", "eu-central-1");
        this.tableName = System.getenv().getOrDefault("DYNAMODB_TABLE", DEFAULT_TABLE);
        this.dynamoDbClient = DynamoDbClient.builder().region(Region.of(regionStr)).build();
        this.dataProvider = new DynamoDbGraphDataProvider(dynamoDbClient, tableName);
        this.bfsFinder = new BidirectionalBfsFinder(dataProvider);
        this.validator = new GameSessionValidator(dataProvider);
        this.idempotencyService = new DynamoDbIdempotencyService(dynamoDbClient, tableName);
        this.dailyService = new DailyChallengeService(dataProvider, bfsFinder);
    }

    public GameApiHandler(
            DynamoDbClient dynamoDbClient,
            String tableName,
            GraphDataProvider dataProvider,
            BidirectionalBfsFinder bfsFinder,
            GameSessionValidator validator,
            IdempotencyService idempotencyService,
            DailyChallengeService dailyService
    ) {
        this.objectMapper = new ObjectMapper();
        this.dynamoDbClient = dynamoDbClient;
        this.tableName = tableName;
        this.dataProvider = dataProvider;
        this.bfsFinder = bfsFinder;
        this.validator = validator;
        this.idempotencyService = idempotencyService;
        this.dailyService = dailyService;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent request, Context context) {
        String httpMethod = request.getHttpMethod();
        String path = request.getPath() != null ? request.getPath() : "";

        if ("OPTIONS".equalsIgnoreCase(httpMethod)) {
            return response(200, Map.of("status", "OK"));
        }

        try {
            if ("GET".equalsIgnoreCase(httpMethod) && path.endsWith("/daily")) {
                DailyChallengeResponse challenge = dailyService.getDailyChallenge(LocalDate.now());
                return response(200, challenge);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.endsWith("/shortest-path")) {
                Map<String, String> queryParams = request.getQueryStringParameters();
                String start = queryParams != null ? queryParams.get("start") : null;
                String target = queryParams != null ? queryParams.get("target") : null;

                if (start == null || target == null) {
                    return response(400, Map.of("error", "Both 'start' and 'target' query parameters are required."));
                }

                ShortestPathResult result = bfsFinder.findShortestPath(start, target);
                return response(200, result);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.endsWith("/leaderboard")) {
                Map<String, String> queryParams = request.getQueryStringParameters();
                String date = queryParams != null && queryParams.containsKey("date")
                        ? queryParams.get("date")
                        : LocalDate.now().toString();
                return handleGetLeaderboard(date);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.matches(".*/actors/[^/]+/movies/?$")) {
                String actorId = path.replaceAll(".*/actors/([^/]+)/movies/?$", "$1");
                return handleGetActorMovies(actorId);
            }

            if ("GET".equalsIgnoreCase(httpMethod) && path.matches(".*/movies/[^/]+/cast/?$")) {
                String movieId = path.replaceAll(".*/movies/([^/]+)/cast/?$", "$1");
                return handleGetMovieCast(movieId);
            }

            if ("POST".equalsIgnoreCase(httpMethod) && path.endsWith("/games/submit")) {
                return handleSubmitGame(request);
            }

            return response(404, Map.of("error", "Resource not found", "path", path));
        } catch (Exception e) {
            log.error("Unhandled exception processing request: {}", e.getMessage(), e);
            return response(500, Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    private APIGatewayProxyResponseEvent handleGetActorMovies(String actorId) {
        List<MovieActorEdge> edges = dataProvider.findMoviesByActor(actorId);
        List<Movie> movies = edges.parallelStream()
                .map(e -> dataProvider.findMovieById(e.movieId()))
                .flatMap(Optional::stream)
                .sorted(Comparator.comparingInt(Movie::voteCount).reversed())
                .toList();
        return response(200, movies);
    }

    private APIGatewayProxyResponseEvent handleGetMovieCast(String movieId) {
        List<MovieActorEdge> edges = dataProvider.findActorsByMovie(movieId);
        List<Map<String, Object>> cast = edges.parallelStream()
                .map(e -> {
                    Optional<Actor> actor = dataProvider.findActorById(e.actorId());
                    if (actor.isEmpty()) return null;
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", actor.get().id());
                    map.put("name", actor.get().name());
                    map.put("popularity", actor.get().popularity());
                    map.put("profilePath", actor.get().profilePath());
                    map.put("character", e.character());
                    map.put("billingOrder", e.billingOrder());
                    return map;
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingInt(m -> (int) m.get("billingOrder")))
                .toList();
        return response(200, cast);
    }

    private APIGatewayProxyResponseEvent handleGetLeaderboard(String date) {
        QueryRequest query = QueryRequest.builder()
                .tableName(tableName)
                .indexName("GSI1")
                .keyConditionExpression("GSI1PK = :pk")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.fromS("LEADERBOARD#" + date)
                ))
                .scanIndexForward(true)
                .limit(50)
                .build();

        var response = dynamoDbClient.query(query);
        List<LeaderboardEntry> entries = response.items().stream()
                .map(item -> new LeaderboardEntry(
                        item.get("userId").s(),
                        Long.parseLong(item.get("score").n()),
                        Integer.parseInt(item.get("moves").n()),
                        Long.parseLong(item.get("durationSeconds").n()),
                        item.containsKey("updatedAt") ? item.get("updatedAt").s() : ""
                ))
                .toList();

        return response(200, entries);
    }

    private APIGatewayProxyResponseEvent handleSubmitGame(APIGatewayProxyRequestEvent request) throws Exception {
        String idempotencyKey = getHeader(request, "Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return response(400, Map.of("error", "Header 'Idempotency-Key' is required."));
        }

        boolean lockAcquired = idempotencyService.tryAcquireLock(idempotencyKey, Duration.ofHours(24));
        if (!lockAcquired) {
            Optional<IdempotencyRecord> existing = idempotencyService.getRecord(idempotencyKey);
            if (existing.isPresent()) {
                IdempotencyRecord record = existing.get();
                if (record.status() == IdempotencyStatus.COMPLETED && record.responseBody() != null) {
                    return responseRaw(200, record.responseBody());
                }
            }
            return response(409, Map.of("error", "Request with this Idempotency-Key is currently in progress."));
        }

        GameSubmission submission = objectMapper.readValue(request.getBody(), GameSubmission.class);
        ValidationResult result = validator.validate(submission);

        if (!result.valid()) {
            String failureJson = objectMapper.writeValueAsString(result);
            idempotencyService.markCompleted(idempotencyKey, failureJson);
            return response(400, result);
        }

        saveGameSessionAndOutboxEvent(submission, result);

        String successJson = objectMapper.writeValueAsString(result);
        idempotencyService.markCompleted(idempotencyKey, successJson);

        return response(200, result);
    }

    private void saveGameSessionAndOutboxEvent(GameSubmission submission, ValidationResult result) throws Exception {
        String dateStr = LocalDate.now().toString();
        String sessionId = UUID.randomUUID().toString();
        String eventId = UUID.randomUUID().toString();
        String timestamp = Instant.now().toString();

        Map<String, AttributeValue> sessionItem = new HashMap<>();
        sessionItem.put("PK", AttributeValue.fromS("USER#" + submission.userId()));
        sessionItem.put("SK", AttributeValue.fromS("SESSION#" + dateStr + "#" + sessionId));
        sessionItem.put("GSI1PK", AttributeValue.fromS("GAME#" + dateStr));
        sessionItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + String.format("%06d", result.score())));
        sessionItem.put("Type", AttributeValue.fromS("SESSION"));
        sessionItem.put("userId", AttributeValue.fromS(submission.userId()));
        sessionItem.put("score", AttributeValue.fromN(String.valueOf(result.score())));
        sessionItem.put("moves", AttributeValue.fromN(String.valueOf(result.moves())));
        sessionItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(submission.durationSeconds())));
        sessionItem.put("startActorId", AttributeValue.fromS(submission.startActorId()));
        sessionItem.put("targetActorId", AttributeValue.fromS(submission.targetActorId()));
        sessionItem.put("createdAt", AttributeValue.fromS(timestamp));

        Map<String, Object> eventPayload = Map.of(
                "eventId", eventId,
                "userId", submission.userId(),
                "date", dateStr,
                "score", result.score(),
                "moves", result.moves(),
                "durationSeconds", submission.durationSeconds(),
                "timestamp", timestamp
        );
        String payloadJson = objectMapper.writeValueAsString(eventPayload);

        Map<String, AttributeValue> outboxItem = new HashMap<>();
        outboxItem.put("PK", AttributeValue.fromS("OUTBOX#" + eventId));
        outboxItem.put("SK", AttributeValue.fromS("TIMESTAMP#" + timestamp));
        outboxItem.put("Type", AttributeValue.fromS("OUTBOX"));
        outboxItem.put("EventType", AttributeValue.fromS("GameCompleted"));
        outboxItem.put("Payload", AttributeValue.fromS(payloadJson));
        outboxItem.put("Status", AttributeValue.fromS("PENDING"));

        TransactWriteItemsRequest txRequest = TransactWriteItemsRequest.builder()
                .transactItems(
                        TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(sessionItem).build()).build(),
                        TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(outboxItem).build()).build()
                )
                .build();

        dynamoDbClient.transactWriteItems(txRequest);
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
            return responseRaw(statusCode, objectMapper.writeValueAsString(body));
        } catch (Exception e) {
            return responseRaw(500, "{\"error\":\"Serialization failure\"}");
        }
    }

    private APIGatewayProxyResponseEvent responseRaw(int statusCode, String json) {
        Map<String, String> headers = Map.of(
                "Content-Type", "application/json",
                "Access-Control-Allow-Origin", "*",
                "Access-Control-Allow-Methods", "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, Authorization"
        );
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody(json);
    }
}
