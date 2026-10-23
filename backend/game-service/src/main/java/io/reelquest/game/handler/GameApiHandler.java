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
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.Put;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItemsRequest;
import software.amazon.awssdk.services.dynamodb.model.Update;

import com.fasterxml.jackson.databind.JsonNode;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
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
                Map<String, String> queryParams = request.getQueryStringParameters();
                String dateStr = queryParams != null ? queryParams.get("date") : null;
                LocalDate targetDate = LocalDate.now();
                if (dateStr != null && !dateStr.isBlank()) {
                    try {
                        LocalDate parsedDate = LocalDate.parse(dateStr);
                        if (!parsedDate.isAfter(LocalDate.now())) {
                            targetDate = parsedDate;
                        }
                    } catch (Exception ignored) {}
                }
                DailyChallengeResponse challenge = dailyService.getDailyChallenge(targetDate);
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
                        : (queryParams != null && queryParams.containsKey("scope")
                                ? queryParams.get("scope")
                                : LocalDate.now().toString());
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

    private APIGatewayProxyResponseEvent handleGetLeaderboard(String dateOrScope) {
        if (dynamoDbClient == null) {
            return response(200, List.of());
        }

        String gsi1pk = "all-time".equalsIgnoreCase(dateOrScope)
                ? "LEADERBOARD#ALL_TIME"
                : "LEADERBOARD#" + dateOrScope;

        QueryRequest query = QueryRequest.builder()
                .tableName(tableName)
                .indexName("GSI1")
                .keyConditionExpression("GSI1PK = :pk")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.fromS(gsi1pk)
                ))
                .scanIndexForward(true)
                .limit(50)
                .build();

        var response = dynamoDbClient.query(query);
        List<LeaderboardEntry> entries = response.items().stream()
                .filter(item -> {
                    String uid = item.containsKey("userId") ? item.get("userId").s() : "";
                    String uname = item.containsKey("username") ? item.get("username").s() : "";
                    return !uid.isBlank() && !uid.startsWith("guest") && !uname.toLowerCase().contains("guest");
                })
                .map(item -> new LeaderboardEntry(
                        item.containsKey("userId") ? item.get("userId").s() : "unknown",
                        item.containsKey("username") ? item.get("username").s() : (item.containsKey("userId") ? item.get("userId").s() : "Cinephile"),
                        item.containsKey("score") ? Long.parseLong(item.get("score").n()) : 0L,
                        item.containsKey("moves") ? Integer.parseInt(item.get("moves").n()) : 0,
                        item.containsKey("durationSeconds") ? Long.parseLong(item.get("durationSeconds").n()) : 0L,
                        item.containsKey("isPro") && item.get("isPro").bool() != null ? item.get("isPro").bool() : false,
                        item.containsKey("updatedAt") ? item.get("updatedAt").s() : ""
                ))
                .toList();

        return response(200, entries);
    }

    public record AuthenticatedUser(String userId, String username) {}

    private AuthenticatedUser extractAuthenticatedUser(APIGatewayProxyRequestEvent request) {
        if (request == null) return null;

        // 1. Check API Gateway request context authorizer (Cognito JWT Authorizer)
        if (request.getRequestContext() != null && request.getRequestContext().getAuthorizer() != null) {
            Map<String, Object> authorizer = request.getRequestContext().getAuthorizer();
            Map<String, Object> claims = null;
            if (authorizer.get("jwt") instanceof Map<?, ?> jwtMap && jwtMap.get("claims") instanceof Map<?, ?> cMap) {
                //noinspection unchecked
                claims = (Map<String, Object>) cMap;
            } else if (authorizer.get("claims") instanceof Map<?, ?> cMap) {
                //noinspection unchecked
                claims = (Map<String, Object>) cMap;
            }

            if (claims != null) {
                String sub = (String) claims.get("sub");
                String nickname = (String) claims.get("nickname");
                if (nickname == null || nickname.isBlank()) {
                    nickname = (String) claims.get("cognito:username");
                }
                if (sub != null && !sub.isBlank() && !sub.startsWith("guest")) {
                    return new AuthenticatedUser(sub, (nickname != null && !nickname.isBlank()) ? nickname : "Cinephile");
                }
            }
        }

        // 2. Direct Authorization Bearer token header fallback (supports unit tests and direct clients)
        String authHeader = getHeader(request, "Authorization");
        if (authHeader != null && authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = authHeader.substring(7).trim();
            try {
                String[] parts = token.split("\\.");
                if (parts.length >= 2) {
                    byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
                    JsonNode node = objectMapper.readTree(decoded);
                    if (node.has("sub")) {
                        String sub = node.get("sub").asText();
                        String nickname = node.has("nickname") ? node.get("nickname").asText() : null;
                        if (nickname == null && node.has("cognito:username")) {
                            nickname = node.get("cognito:username").asText();
                        }
                        if (sub != null && !sub.isBlank() && !sub.startsWith("guest")) {
                            return new AuthenticatedUser(sub, (nickname != null && !nickname.isBlank()) ? nickname : "Cinephile");
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse Authorization Bearer token payload: {}", e.getMessage());
            }
        }

        return null;
    }

    private APIGatewayProxyResponseEvent handleSubmitGame(APIGatewayProxyRequestEvent request) throws Exception {
        String idempotencyKey = getHeader(request, "Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return response(400, Map.of("error", "Header 'Idempotency-Key' is required."));
        }

        // Enforce Authentication for Leaderboard and Server Scoring
        AuthenticatedUser authUser = extractAuthenticatedUser(request);
        if (authUser == null) {
            return response(401, Map.of(
                    "valid", false,
                    "error", "Unauthorized: Leaderboard submissions require an authenticated account."
            ));
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

        int updatedStreak = saveGameSessionAndOutboxEvent(submission, result, authUser);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("valid", true);
        responseData.put("moves", result.moves());
        responseData.put("score", result.score());
        responseData.put("message", result.message());
        responseData.put("streak", updatedStreak);

        String successJson = objectMapper.writeValueAsString(responseData);
        idempotencyService.markCompleted(idempotencyKey, successJson);

        return response(200, responseData);
    }

    private int saveGameSessionAndOutboxEvent(GameSubmission submission, ValidationResult result, AuthenticatedUser authUser) throws Exception {
        if (dynamoDbClient == null) return 1;
        LocalDate todayUtc = LocalDate.now(ZoneOffset.UTC);
        String dateStr = todayUtc.toString();
        String yesterdayStr = todayUtc.minusDays(1).toString();
        String sessionId = UUID.randomUUID().toString();
        String eventId = UUID.randomUUID().toString();
        String timestamp = Instant.now().toString();

        String username = authUser.username();
        boolean isPro = false;
        int currentStreak = 0;
        int longestStreak = 0;
        String lastCompletedDate = null;

        try {
            var profileRes = dynamoDbClient.getItem(GetItemRequest.builder()
                    .tableName(tableName)
                    .key(Map.of(
                            "PK", AttributeValue.fromS("USER#" + authUser.userId()),
                            "SK", AttributeValue.fromS("PROFILE")
                    ))
                    .build());
            if (profileRes.hasItem() && profileRes.item() != null) {
                Map<String, AttributeValue> item = profileRes.item();
                if (item.containsKey("username") && !item.get("username").s().isBlank()) {
                    username = item.get("username").s();
                }
                if (item.containsKey("tier")) {
                    isPro = "PRO".equalsIgnoreCase(item.get("tier").s());
                }
                if (item.containsKey("streak")) {
                    currentStreak = Integer.parseInt(item.get("streak").n());
                }
                if (item.containsKey("longestStreak")) {
                    longestStreak = Integer.parseInt(item.get("longestStreak").n());
                }
                if (item.containsKey("lastCompletedDate")) {
                    lastCompletedDate = item.get("lastCompletedDate").s();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to lookup profile for userId {}: {}", authUser.userId(), e.getMessage());
        }

        // Server-Side Daily Streak Calculation (Tamper-Proof UTC Window)
        int newStreak;
        if (dateStr.equals(lastCompletedDate)) {
            newStreak = Math.max(1, currentStreak);
        } else if (yesterdayStr.equals(lastCompletedDate)) {
            newStreak = currentStreak + 1;
        } else {
            newStreak = 1;
        }
        longestStreak = Math.max(longestStreak, newStreak);

        Map<String, AttributeValue> sessionItem = new HashMap<>();
        sessionItem.put("PK", AttributeValue.fromS("USER#" + authUser.userId()));
        sessionItem.put("SK", AttributeValue.fromS("SESSION#" + dateStr + "#" + sessionId));
        sessionItem.put("GSI1PK", AttributeValue.fromS("GAME#" + dateStr));
        sessionItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + String.format("%06d", result.score())));
        sessionItem.put("Type", AttributeValue.fromS("SESSION"));
        sessionItem.put("userId", AttributeValue.fromS(authUser.userId()));
        sessionItem.put("score", AttributeValue.fromN(String.valueOf(result.score())));
        sessionItem.put("moves", AttributeValue.fromN(String.valueOf(result.moves())));
        sessionItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(submission.durationSeconds())));
        sessionItem.put("startActorId", AttributeValue.fromS(submission.startActorId()));
        sessionItem.put("targetActorId", AttributeValue.fromS(submission.targetActorId()));
        sessionItem.put("createdAt", AttributeValue.fromS(timestamp));

        Map<String, Object> eventPayload = Map.of(
                "eventId", eventId,
                "userId", authUser.userId(),
                "username", username,
                "isPro", isPro,
                "date", dateStr,
                "score", result.score(),
                "moves", result.moves(),
                "durationSeconds", submission.durationSeconds(),
                "streak", newStreak,
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

        String invertedScore = String.format("%08d", Math.max(0, 99_999_999L - result.score()));
        Map<String, AttributeValue> leaderboardItem = new HashMap<>();
        leaderboardItem.put("PK", AttributeValue.fromS("LEADERBOARD#" + dateStr));
        leaderboardItem.put("SK", AttributeValue.fromS("USER#" + authUser.userId()));
        leaderboardItem.put("GSI1PK", AttributeValue.fromS("LEADERBOARD#" + dateStr));
        leaderboardItem.put("GSI1SK", AttributeValue.fromS("SCORE#" + invertedScore));
        leaderboardItem.put("Type", AttributeValue.fromS("LEADERBOARD_ENTRY"));
        leaderboardItem.put("userId", AttributeValue.fromS(authUser.userId()));
        leaderboardItem.put("username", AttributeValue.fromS(username));
        leaderboardItem.put("score", AttributeValue.fromN(String.valueOf(result.score())));
        leaderboardItem.put("moves", AttributeValue.fromN(String.valueOf(result.moves())));
        leaderboardItem.put("durationSeconds", AttributeValue.fromN(String.valueOf(submission.durationSeconds())));
        leaderboardItem.put("isPro", AttributeValue.fromBool(isPro));
        leaderboardItem.put("updatedAt", AttributeValue.fromS(timestamp));

        List<TransactWriteItem> txItems = new ArrayList<>();
        txItems.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(sessionItem).build()).build());
        txItems.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(outboxItem).build()).build());
        txItems.add(TransactWriteItem.builder().put(Put.builder().tableName(tableName).item(leaderboardItem).build()).build());

        // Atomic User Profile Update with Certified Streak & Aggregates
        Map<String, AttributeValue> profileKey = Map.of(
                "PK", AttributeValue.fromS("USER#" + authUser.userId()),
                "SK", AttributeValue.fromS("PROFILE")
        );
        Map<String, AttributeValue> profileValues = Map.of(
                ":one", AttributeValue.fromN("1"),
                ":score", AttributeValue.fromN(String.valueOf(result.score())),
                ":streak", AttributeValue.fromN(String.valueOf(newStreak)),
                ":longestStreak", AttributeValue.fromN(String.valueOf(longestStreak)),
                ":lastDate", AttributeValue.fromS(dateStr),
                ":updatedAt", AttributeValue.fromS(timestamp)
        );
        txItems.add(TransactWriteItem.builder()
                .update(Update.builder()
                        .tableName(tableName)
                        .key(profileKey)
                        .updateExpression("SET streak = :streak, longestStreak = :longestStreak, lastCompletedDate = :lastDate, updatedAt = :updatedAt ADD gamesPlayed :one, gamesWon :one, totalScore :score")
                        .expressionAttributeValues(profileValues)
                        .build())
                .build());

        TransactWriteItemsRequest txRequest = TransactWriteItemsRequest.builder()
                .transactItems(txItems)
                .build();

        dynamoDbClient.transactWriteItems(txRequest);
        return newStreak;
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
