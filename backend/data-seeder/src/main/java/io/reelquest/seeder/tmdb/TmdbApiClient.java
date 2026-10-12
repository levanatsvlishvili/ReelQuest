package io.reelquest.seeder.tmdb;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

public class TmdbApiClient implements AutoCloseable {

    private static final Logger log = LoggerFactory.getLogger(TmdbApiClient.class);
    private static final String TMDB_BASE_URL = "https://api.themoviedb.org/3";
    private static final String DEFAULT_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3YTM1ZDE5NzY3YWEwMDY4NTIwYzY5NDU5OWMzMWRiMCIsIm5iZiI6MTc5MTgzMzY3OS45ODIsInN1YiI6IjZhY2QzNjRmMzdlY2QyMjc1NDAzNGE1YiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.qz934CyhwaCrtWLIA65fWbeEcOR6HKda4Rrd0nEnspY";

    private static final Map<Integer, String> GENRE_MAP = Map.ofEntries(
            Map.entry(28, "Action"),
            Map.entry(12, "Adventure"),
            Map.entry(16, "Animation"),
            Map.entry(35, "Comedy"),
            Map.entry(80, "Crime"),
            Map.entry(99, "Documentary"),
            Map.entry(18, "Drama"),
            Map.entry(10751, "Family"),
            Map.entry(14, "Fantasy"),
            Map.entry(36, "History"),
            Map.entry(27, "Horror"),
            Map.entry(10402, "Music"),
            Map.entry(9648, "Mystery"),
            Map.entry(10749, "Romance"),
            Map.entry(878, "Science Fiction"),
            Map.entry(10770, "TV Movie"),
            Map.entry(53, "Thriller"),
            Map.entry(10752, "War"),
            Map.entry(37, "Western")
    );

    private final String bearerToken;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final RateLimiter rateLimiter;

    public record TmdbMovieDto(
            String id,
            String title,
            int year,
            double rating,
            int voteCount,
            String posterPath,
            String overview,
            List<String> genres,
            String releaseDate,
            String backdropPath
    ) {}

    public record TmdbCastDto(
            String id,
            String name,
            double popularity,
            String profilePath,
            String character,
            int order,
            String department
    ) {}

    public record TmdbCreditsDto(
            List<TmdbCastDto> cast,
            String director
    ) {}

    public record DiscoverResponse(
            List<TmdbMovieDto> movies,
            int totalPages
    ) {}

    public TmdbApiClient() {
        this(System.getenv().getOrDefault("TMDB_READ_TOKEN", DEFAULT_TOKEN));
    }

    public TmdbApiClient(String bearerToken) {
        this.bearerToken = bearerToken;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
        this.rateLimiter = new RateLimiter(30);
    }

    public DiscoverResponse discoverTopMovies(int page, int minVoteCount) {
        String url = String.format(
                "%s/discover/movie?sort_by=vote_count.desc&vote_count.gte=%d&language=en-US&page=%d",
                TMDB_BASE_URL, minVoteCount, page
        );

        String json = executeWithRetry(url);
        try {
            JsonNode root = objectMapper.readTree(json);
            int totalPages = root.has("total_pages") ? root.get("total_pages").asInt() : 1;
            List<TmdbMovieDto> movies = new ArrayList<>();

            if (root.has("results")) {
                for (JsonNode m : root.get("results")) {
                    String id = String.valueOf(m.get("id").asLong());
                    String title = m.has("title") ? m.get("title").asText() : "Unknown";
                    String releaseDate = m.has("release_date") ? m.get("release_date").asText() : null;
                    int year = 0;
                    if (releaseDate != null && releaseDate.length() >= 4) {
                        try {
                            year = Integer.parseInt(releaseDate.substring(0, 4));
                        } catch (NumberFormatException ignored) {}
                    }
                    double rating = m.has("vote_average") ? m.get("vote_average").asDouble() : 0.0;
                    int voteCount = m.has("vote_count") ? m.get("vote_count").asInt() : 0;
                    String posterPath = m.has("poster_path") && !m.get("poster_path").isNull() ? m.get("poster_path").asText() : null;
                    String overview = m.has("overview") && !m.get("overview").isNull() ? m.get("overview").asText() : null;
                    String backdropPath = m.has("backdrop_path") && !m.get("backdrop_path").isNull() ? m.get("backdrop_path").asText() : null;

                    List<String> genres = new ArrayList<>();
                    if (m.has("genre_ids")) {
                        for (JsonNode gId : m.get("genre_ids")) {
                            String gName = GENRE_MAP.get(gId.asInt());
                            if (gName != null) {
                                genres.add(gName);
                            }
                        }
                    }

                    movies.add(new TmdbMovieDto(id, title, year, rating, voteCount, posterPath, overview, genres, releaseDate, backdropPath));
                }
            }

            return new DiscoverResponse(movies, totalPages);
        } catch (Exception e) {
            log.error("Failed to parse discover response for page {}: {}", page, e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public TmdbCreditsDto getMovieCredits(String movieId) {
        String url = String.format("%s/movie/%s/credits?language=en-US", TMDB_BASE_URL, movieId);
        String json = executeWithRetry(url);

        try {
            JsonNode root = objectMapper.readTree(json);
            List<TmdbCastDto> castList = new ArrayList<>();
            String director = null;

            if (root.has("cast")) {
                for (JsonNode c : root.get("cast")) {
                    String id = String.valueOf(c.get("id").asLong());
                    String name = c.has("name") ? c.get("name").asText() : "Unknown";
                    double popularity = c.has("popularity") ? c.get("popularity").asDouble() : 0.0;
                    String profilePath = c.has("profile_path") && !c.get("profile_path").isNull() ? c.get("profile_path").asText() : null;
                    String character = c.has("character") && !c.get("character").isNull() ? c.get("character").asText() : null;
                    int order = c.has("order") ? c.get("order").asInt() : 99;
                    String department = c.has("known_for_department") && !c.get("known_for_department").isNull()
                            ? c.get("known_for_department").asText() : "Acting";

                    castList.add(new TmdbCastDto(id, name, popularity, profilePath, character, order, department));
                }
            }

            if (root.has("crew")) {
                for (JsonNode cr : root.get("crew")) {
                    if (cr.has("job") && "Director".equalsIgnoreCase(cr.get("job").asText())) {
                        director = cr.get("name").asText();
                        break;
                    }
                }
            }

            return new TmdbCreditsDto(castList, director);
        } catch (Exception e) {
            log.warn("Failed to parse credits for movie {}: {}", movieId, e.getMessage());
            return new TmdbCreditsDto(List.of(), null);
        }
    }

    private String executeWithRetry(String url) {
        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            rateLimiter.acquire();
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Authorization", "Bearer " + bearerToken)
                        .header("Accept", "application/json")
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    return response.body();
                } else if (response.statusCode() == 429) {
                    log.warn("TMDB Rate limit exceeded (429). Attempt {}/{}. Backing off...", attempt, maxAttempts);
                    Thread.sleep(1500L * attempt);
                } else {
                    log.warn("TMDB request returned status {}. Attempt {}/{}", response.statusCode(), attempt, maxAttempts);
                    if (attempt == maxAttempts) {
                        throw new RuntimeException("TMDB request failed with status " + response.statusCode() + ": " + url);
                    }
                    Thread.sleep(500L * attempt);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted during TMDB request", e);
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    throw new RuntimeException("Failed TMDB request after " + maxAttempts + " attempts: " + url, e);
                }
                try {
                    Thread.sleep(500L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
            }
        }
        throw new RuntimeException("Exhausted retries for " + url);
    }

    private static class RateLimiter {
        private final int permitsPerSecond;
        private final Semaphore semaphore;
        private final ScheduledExecutorService scheduler;

        public RateLimiter(int permitsPerSecond) {
            this.permitsPerSecond = permitsPerSecond;
            this.semaphore = new Semaphore(permitsPerSecond);
            this.scheduler = Executors.newSingleThreadScheduledExecutor(Thread.ofPlatform().daemon().factory());
            this.scheduler.scheduleAtFixedRate(() -> {
                int toRelease = permitsPerSecond - semaphore.availablePermits();
                if (toRelease > 0) {
                    semaphore.release(toRelease);
                }
            }, 1, 1, TimeUnit.SECONDS);
        }

        public void acquire() {
            try {
                semaphore.acquire();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException(e);
            }
        }

        public void close() {
            scheduler.shutdownNow();
        }
    }

    public void close() {
        rateLimiter.close();
    }
}
