package io.reelquest.seeder.tmdb;

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

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class TmdbIngestionPipeline {

    private static final Logger log = LoggerFactory.getLogger(TmdbIngestionPipeline.class);
    private static final int DYNAMO_BATCH_SIZE = 25;

    private final TmdbApiClient tmdbClient;

    public record IngestionConfig(
            int maxMovies,
            int minVoteCount,
            int maxCastPerMovie,
            String tableName,
            String region,
            boolean writeToDynamo
    ) {
        public static IngestionConfig testConfig(String tableName, String region) {
            return new IngestionConfig(20, 1000, 12, tableName, region, true);
        }

        public static IngestionConfig custom(int count, String tableName, String region) {
            return new IngestionConfig(count, count <= 1000 ? 800 : 500, 15, tableName, region, true);
        }

        public static IngestionConfig fullConfig(String tableName, String region) {
            return new IngestionConfig(5000, 500, 15, tableName, region, true);
        }
    }

    public record IngestionSummary(
            int moviesCount,
            int actorsCount,
            int edgesCount,
            int totalDynamoItems,
            long elapsedMillis
    ) {}

    public TmdbIngestionPipeline(TmdbApiClient tmdbClient) {
        this.tmdbClient = tmdbClient;
    }

    public IngestionSummary run(IngestionConfig config) {
        Instant start = Instant.now();
        log.info("Starting TMDB Ingestion Pipeline with config: maxMovies={}, minVoteCount={}, maxCast={}, table={}",
                config.maxMovies(), config.minVoteCount(), config.maxCastPerMovie(), config.tableName());

        List<TmdbApiClient.TmdbMovieDto> collectedMovieDtos = new ArrayList<>();
        int page = 1;
        while (collectedMovieDtos.size() < config.maxMovies()) {
            TmdbApiClient.DiscoverResponse response = tmdbClient.discoverTopMovies(page, config.minVoteCount());
            if (response.movies().isEmpty()) {
                break;
            }
            for (var m : response.movies()) {
                collectedMovieDtos.add(m);
                if (collectedMovieDtos.size() >= config.maxMovies()) {
                    break;
                }
            }
            if (page >= response.totalPages()) {
                break;
            }
            page++;
        }

        log.info("Discovered {} movies from TMDB across {} pages. Fetching credits via Virtual Threads...",
                collectedMovieDtos.size(), page);

        Map<String, Movie> moviesMap = new ConcurrentHashMap<>();
        Map<String, Actor> actorsMap = new ConcurrentHashMap<>();
        Map<String, MovieActorEdge> edgesMap = new ConcurrentHashMap<>();
        AtomicInteger processedMovies = new AtomicInteger(0);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Void>> futures = collectedMovieDtos.stream()
                    .map(mDto -> CompletableFuture.runAsync(() -> {
                        TmdbApiClient.TmdbCreditsDto credits = tmdbClient.getMovieCredits(mDto.id());

                        Movie movie = new Movie(
                                mDto.id(),
                                mDto.title(),
                                mDto.year(),
                                mDto.rating(),
                                mDto.posterPath(),
                                mDto.voteCount(),
                                mDto.overview(),
                                mDto.genres(),
                                credits.director(),
                                mDto.releaseDate(),
                                mDto.backdropPath()
                        );
                        moviesMap.put(movie.id(), movie);

                        for (TmdbApiClient.TmdbCastDto cast : credits.cast()) {
                            if (cast.order() > config.maxCastPerMovie()) {
                                continue;
                            }

                            actorsMap.computeIfAbsent(cast.id(), id -> new Actor(
                                    cast.id(),
                                    cast.name(),
                                    cast.popularity(),
                                    cast.profilePath(),
                                    cast.department()
                            ));

                            String edgeKey = cast.id() + "#" + movie.id();
                            edgesMap.compute(edgeKey, (k, existing) -> {
                                if (existing == null) {
                                    return new MovieActorEdge(cast.id(), movie.id(), cast.character(), cast.order());
                                }
                                String mergedChar = (existing.character() != null ? existing.character() : "")
                                        + (cast.character() != null ? " / " + cast.character() : "");
                                int minOrder = Math.min(existing.billingOrder(), cast.order());
                                return new MovieActorEdge(cast.id(), movie.id(), mergedChar, minOrder);
                            });
                        }

                        int current = processedMovies.incrementAndGet();
                        if (current % 100 == 0 || current == collectedMovieDtos.size()) {
                            log.info("Processed credits for {}/{} movies ({} unique actors, {} edges so far)",
                                    current, collectedMovieDtos.size(), actorsMap.size(), edgesMap.size());
                        }
                    }, executor))
                    .toList();

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        }

        log.info("Credit aggregation complete: {} movies, {} actors, {} edges",
                moviesMap.size(), actorsMap.size(), edgesMap.size());

        Map<String, Map<String, AttributeValue>> uniqueItems = new java.util.LinkedHashMap<>();
        for (Movie movie : moviesMap.values()) {
            Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(movie);
            uniqueItems.put(item.get("PK").s() + "###" + item.get("SK").s(), item);
        }
        for (Actor actor : actorsMap.values()) {
            Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(actor);
            uniqueItems.put(item.get("PK").s() + "###" + item.get("SK").s(), item);
        }
        for (MovieActorEdge edge : edgesMap.values()) {
            Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(edge);
            uniqueItems.put(item.get("PK").s() + "###" + item.get("SK").s(), item);
        }

        List<Map<String, AttributeValue>> allDynamoItems = new ArrayList<>(uniqueItems.values());

        if (config.writeToDynamo()) {
            log.info("Ingesting {} items into DynamoDB table {}...", allDynamoItems.size(), config.tableName());
            try (DynamoDbClient dynamoDb = DynamoDbClient.builder()
                    .region(Region.of(config.region()))
                    .build()) {

                List<List<Map<String, AttributeValue>>> batches = partition(allDynamoItems, DYNAMO_BATCH_SIZE);
                log.info("Partitioned into {} DynamoDB batches (max {} items/batch)", batches.size(), DYNAMO_BATCH_SIZE);

                var writePermits = new java.util.concurrent.Semaphore(25);
                AtomicInteger writtenBatches = new AtomicInteger(0);

                try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
                    List<CompletableFuture<Void>> futures = batches.stream()
                            .map(batch -> CompletableFuture.runAsync(() -> {
                                try {
                                    writePermits.acquire();
                                    writeBatchWithRetry(dynamoDb, config.tableName(), batch);
                                    int done = writtenBatches.incrementAndGet();
                                    if (done % 100 == 0 || done == batches.size()) {
                                        log.info("Written {}/{} batches to DynamoDB", done, batches.size());
                                    }
                                } catch (InterruptedException e) {
                                    Thread.currentThread().interrupt();
                                    throw new RuntimeException(e);
                                } finally {
                                    writePermits.release();
                                }
                            }, executor))
                            .toList();

                    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                }
            }
        }

        Duration elapsed = Duration.between(start, Instant.now());
        log.info("TMDB Ingestion finished in {} ms. Written: {} movies, {} actors, {} edges (Total items: {})",
                elapsed.toMillis(), moviesMap.size(), actorsMap.size(), edgesMap.size(), allDynamoItems.size());

        return new IngestionSummary(
                moviesMap.size(),
                actorsMap.size(),
                edgesMap.size(),
                allDynamoItems.size(),
                elapsed.toMillis()
        );
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
        while (!requestItems.isEmpty() && attempt < 8) {
            attempt++;
            BatchWriteItemRequest request = BatchWriteItemRequest.builder()
                    .requestItems(requestItems)
                    .build();

            var response = client.batchWriteItem(request);
            if (response.hasUnprocessedItems() && !response.unprocessedItems().isEmpty()) {
                requestItems = response.unprocessedItems();
                try {
                    long sleepMs = (long) Math.pow(2, attempt) * 100 + (long) (Math.random() * 50);
                    Thread.sleep(sleepMs);
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
