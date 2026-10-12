package io.reelquest.seeder.tmdb;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TmdbApiClientTest {

    private final TmdbApiClient client = new TmdbApiClient();

    @Test
    @DisplayName("Should successfully discover top movies from TMDB")
    void shouldDiscoverTopMovies() {
        TmdbApiClient.DiscoverResponse response = client.discoverTopMovies(1, 1000);

        assertThat(response).isNotNull();
        assertThat(response.movies()).isNotEmpty();
        assertThat(response.totalPages()).isGreaterThan(1);

        TmdbApiClient.TmdbMovieDto movie = response.movies().getFirst();
        assertThat(movie.id()).isNotBlank();
        assertThat(movie.title()).isNotBlank();
        assertThat(movie.year()).isGreaterThan(1900);
        assertThat(movie.voteCount()).isGreaterThanOrEqualTo(1000);
    }

    @Test
    @DisplayName("Should fetch credits including cast and director for Inception (27205)")
    void shouldFetchCreditsForInception() {
        TmdbApiClient.TmdbCreditsDto credits = client.getMovieCredits("27205");

        assertThat(credits).isNotNull();
        assertThat(credits.director()).isEqualTo("Christopher Nolan");
        assertThat(credits.cast()).isNotEmpty();

        boolean hasLeo = credits.cast().stream()
                .anyMatch(c -> c.name().contains("DiCaprio"));
        assertThat(hasLeo).isTrue();
    }
}
