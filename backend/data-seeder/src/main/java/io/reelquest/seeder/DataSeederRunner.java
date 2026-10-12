package io.reelquest.seeder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.reelquest.domain.mapper.DynamoDbAdjacencyMapper;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.BatchWriteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutRequest;
import software.amazon.awssdk.services.dynamodb.model.WriteRequest;

import io.reelquest.seeder.tmdb.TmdbApiClient;
import io.reelquest.seeder.tmdb.TmdbIngestionPipeline;

import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;

public class DataSeederRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeederRunner.class);
    private static final String DEFAULT_TABLE = "reelquest-dev-data";
    private static final int BATCH_SIZE = 25;

    public static void main(String[] args) {
        String resolvedTable = System.getenv().getOrDefault("DYNAMODB_TABLE", DEFAULT_TABLE);
        for (String arg : args) {
            if (!arg.startsWith("--") && !arg.isBlank()) {
                resolvedTable = arg;
                break;
            }
        }
        final String tableName = resolvedTable;
        final String regionStr = System.getenv().getOrDefault("AWS_REGION", "eu-central-1");

        Integer customMovieCount = null;
        for (String arg : args) {
            if (arg.startsWith("--movies=")) {
                try {
                    customMovieCount = Integer.parseInt(arg.substring("--movies=".length()));
                } catch (NumberFormatException ignored) {}
            } else if (arg.equals("--tmdb-1000")) {
                customMovieCount = 1000;
            }
        }

        boolean isTmdbTest = Arrays.asList(args).contains("--tmdb-test");
        boolean isTmdbFull = Arrays.asList(args).contains("--tmdb-full");
        boolean isTmdb = isTmdbTest || isTmdbFull || customMovieCount != null;
        int finalMovieCount = isTmdbTest ? 20 : isTmdbFull ? 5000 : (customMovieCount != null ? customMovieCount : 0);

        log.info("==========================================================");
        log.info("🎬 ReelQuest Data Seeder (Java 21 Virtual Threads)");
        log.info("Target Table: {}", tableName);
        log.info("AWS Region:   {}", regionStr);
        log.info("Mode:         {}", isTmdb ? "TMDB Ingestion (" + finalMovieCount + " Movies)" : "Curated Baseline");
        log.info("==========================================================");

        Instant start = Instant.now();

        try {
            if (isTmdb) {
                try (TmdbApiClient apiClient = new TmdbApiClient()) {
                    TmdbIngestionPipeline pipeline = new TmdbIngestionPipeline(apiClient);

                    TmdbIngestionPipeline.IngestionConfig config = isTmdbTest
                            ? TmdbIngestionPipeline.IngestionConfig.testConfig(tableName, regionStr)
                            : isTmdbFull
                            ? TmdbIngestionPipeline.IngestionConfig.fullConfig(tableName, regionStr)
                            : TmdbIngestionPipeline.IngestionConfig.custom(finalMovieCount, tableName, regionStr);

                    var summary = pipeline.run(config);

                    log.info("==========================================================");
                    log.info("✅ TMDB ingestion completed successfully!");
                    log.info("Movies:       {}", summary.moviesCount());
                    log.info("Actors:       {}", summary.actorsCount());
                    log.info("Edges:        {}", summary.edgesCount());
                    log.info("Dynamo Items: {}", summary.totalDynamoItems());
                    log.info("Duration:     {} ms", summary.elapsedMillis());
                    log.info("==========================================================");
                    return;
                }
            }

            try (DynamoDbClient dynamoDb = DynamoDbClient.builder()
                    .region(Region.of(regionStr))
                    .build()) {

                List<Map<String, AttributeValue>> allItems = loadCuratedDataset();
                log.info("Loaded {} graph items (Movies, Actors, Edges). Beginning batch ingestion...", allItems.size());

                List<List<Map<String, AttributeValue>>> batches = partition(allItems, BATCH_SIZE);
                log.info("Created {} DynamoDB write batches (max {} items/batch)", batches.size(), BATCH_SIZE);

                try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
                    List<CompletableFuture<Void>> futures = batches.stream()
                            .map(batch -> CompletableFuture.runAsync(() -> writeBatchWithRetry(dynamoDb, tableName, batch), executor))
                            .toList();

                    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                }

                Duration elapsed = Duration.between(start, Instant.now());
                log.info("==========================================================");
                log.info("✅ Graph seeding completed successfully!");
                log.info("Total items written: {}", allItems.size());
                log.info("Execution time:      {} ms", elapsed.toMillis());
                log.info("==========================================================");
            }

        } catch (Exception e) {
            log.error("❌ Data seeding failed: {}", e.getMessage(), e);
            System.exit(1);
        }
    }

    private static List<Map<String, AttributeValue>> loadCuratedDataset() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, AttributeValue>> items = new ArrayList<>();

        try (InputStream is = DataSeederRunner.class.getResourceAsStream("/curated-movies.json")) {
            if (is == null) {
                throw new IllegalStateException("Resource /curated-movies.json not found in classpath");
            }

            JsonNode root = mapper.readTree(is);

            for (JsonNode m : root.get("movies")) {
                Movie movie = new Movie(
                        m.get("id").asText(),
                        m.get("title").asText(),
                        m.get("year").asInt(),
                        m.get("rating").asDouble(),
                        m.has("posterPath") ? m.get("posterPath").asText() : null,
                        m.has("voteCount") ? m.get("voteCount").asInt() : 0
                );
                items.add(DynamoDbAdjacencyMapper.toItem(movie));
            }

            for (JsonNode a : root.get("actors")) {
                Actor actor = new Actor(
                        a.get("id").asText(),
                        a.get("name").asText(),
                        a.get("popularity").asDouble(),
                        a.has("profilePath") ? a.get("profilePath").asText() : null
                );
                items.add(DynamoDbAdjacencyMapper.toItem(actor));
            }

            for (JsonNode e : root.get("edges")) {
                MovieActorEdge edge = new MovieActorEdge(
                        e.get("actorId").asText(),
                        e.get("movieId").asText(),
                        e.has("character") ? e.get("character").asText() : null,
                        e.get("billingOrder").asInt()
                );
                items.add(DynamoDbAdjacencyMapper.toItem(edge));
            }
        }

        return items;
    }

    private static void writeBatchWithRetry(DynamoDbClient client, String tableName, List<Map<String, AttributeValue>> items) {
        List<WriteRequest> writeRequests = items.stream()
                .map(item -> WriteRequest.builder()
                        .putRequest(PutRequest.builder().item(item).build())
                        .build())
                .toList();

        Map<String, List<WriteRequest>> requestItems = new HashMap<>();
        requestItems.put(tableName, new ArrayList<>(writeRequests));

        int attempt = 0;
        while (!requestItems.isEmpty() && attempt < 5) {
            attempt++;
            BatchWriteItemRequest request = BatchWriteItemRequest.builder()
                    .requestItems(requestItems)
                    .build();

            var response = client.batchWriteItem(request);
            if (response.hasUnprocessedItems() && !response.unprocessedItems().isEmpty()) {
                log.warn("Attempt {}: Retrying {} unprocessed items for table {}",
                        attempt, response.unprocessedItems().get(tableName).size(), tableName);
                requestItems = response.unprocessedItems();
                try {
                    Thread.sleep((long) Math.pow(2, attempt) * 50); // exponential backoff with jitter
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
            } else {
                break;
            }
        }
    }

    private static <T> List<List<T>> partition(List<T> list, int size) {
        List<List<T>> parts = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            parts.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return parts;
    }
}
