package io.reelquest.game.handler;

import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.InMemoryGraphDataProvider;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.game.dto.DailyChallengeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class DailyChallengeServiceTest {

    private InMemoryGraphDataProvider dataProvider;
    private BidirectionalBfsFinder bfsFinder;
    private DailyChallengeService dailyService;

    @BeforeEach
    void setUp() {
        dataProvider = new InMemoryGraphDataProvider();
        bfsFinder = new BidirectionalBfsFinder(dataProvider);

        // Chain of actors: Tom Hanks (31) -(m1)-> DiCaprio (6193) -(m2)-> De Niro (380) -(m3)-> Pacino (1158)
        dataProvider.addActor(new Actor("31", "Tom Hanks", 95.0, null));
        dataProvider.addActor(new Actor("6193", "Leonardo DiCaprio", 98.0, null));
        dataProvider.addActor(new Actor("380", "Robert De Niro", 97.0, null));
        dataProvider.addActor(new Actor("1158", "Al Pacino", 96.0, null));

        dataProvider.addMovie(new Movie("m1", "Catch Me If You Can", 2002, 8.1, null, 100));
        dataProvider.addEdge("31", "m1", "Carl Hanratty", 1);
        dataProvider.addEdge("6193", "m1", "Frank Abagnale", 2);

        dataProvider.addMovie(new Movie("m2", "Killers of the Flower Moon", 2023, 8.0, null, 100));
        dataProvider.addEdge("6193", "m2", "Ernest Burkhart", 1);
        dataProvider.addEdge("380", "m2", "William Hale", 2);

        dataProvider.addMovie(new Movie("m3", "The Irishman", 2019, 7.8, null, 100));
        dataProvider.addEdge("380", "m3", "Frank Sheeran", 1);
        dataProvider.addEdge("1158", "m3", "Jimmy Hoffa", 2);

        dailyService = new DailyChallengeService(dataProvider, bfsFinder);
    }

    @Test
    @DisplayName("Daily challenge must always have optimal degrees >= 2 (never 1-hop co-stars)")
    void shouldAlwaysGenerateChallengesWithAtLeastTwoMovies() {
        for (int i = 0; i < 30; i++) {
            LocalDate date = LocalDate.of(2026, 1, 1).plusDays(i);
            DailyChallengeResponse challenge = dailyService.getDailyChallenge(date);

            assertThat(challenge).isNotNull();
            assertThat(challenge.startActor()).isNotNull();
            assertThat(challenge.targetActor()).isNotNull();
            assertThat(challenge.startActor().id()).isNotEqualTo(challenge.targetActor().id());
            assertThat(challenge.optimalDegrees())
                    .as("Daily challenge on %s must require at least 2 movies", date)
                    .isGreaterThanOrEqualTo(2);
        }
    }

    @Test
    @DisplayName("Random challenge generation must enforce optimal degrees >= 2")
    void shouldAlwaysReturnRandomChallengeWithAtLeastTwoMovies() {
        for (int i = 0; i < 15; i++) {
            DailyChallengeResponse challenge = dailyService.getRandomChallenge();

            assertThat(challenge).isNotNull();
            assertThat(challenge.startActor()).isNotNull();
            assertThat(challenge.targetActor()).isNotNull();
            assertThat(challenge.startActor().id()).isNotEqualTo(challenge.targetActor().id());
            assertThat(challenge.optimalDegrees())
                    .as("Random challenge must require at least 2 movies")
                    .isGreaterThanOrEqualTo(2);
        }
    }
}
