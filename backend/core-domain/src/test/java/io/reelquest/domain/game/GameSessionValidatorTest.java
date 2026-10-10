package io.reelquest.domain.game;

import io.reelquest.domain.graph.InMemoryGraphDataProvider;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class GameSessionValidatorTest {

    private InMemoryGraphDataProvider dataProvider;
    private GameSessionValidator validator;

    @BeforeEach
    void setUp() {
        dataProvider = new InMemoryGraphDataProvider();
        validator = new GameSessionValidator(dataProvider);

        dataProvider.addActor(new Actor("a_hanks", "Tom Hanks", 95.0, null));
        dataProvider.addActor(new Actor("a_leo", "Leonardo DiCaprio", 98.0, null));
        dataProvider.addActor(new Actor("a_damon", "Matt Damon", 92.0, null));
        dataProvider.addActor(new Actor("a_bale", "Christian Bale", 93.0, null));

        dataProvider.addMovie(new Movie("m_catch", "Catch Me If You Can", 2002, 8.1, null, 100));
        dataProvider.addMovie(new Movie("m_departed", "The Departed", 2006, 8.5, null, 100));

        dataProvider.addEdge("a_hanks", "m_catch", "Carl Hanratty", 1);
        dataProvider.addEdge("a_leo", "m_catch", "Frank Abagnale", 2);

        dataProvider.addEdge("a_leo", "m_departed", "Billy Costigan", 1);
        dataProvider.addEdge("a_damon", "m_departed", "Colin Sullivan", 2);
    }

    @Test
    @DisplayName("Valid continuous path should pass and compute score")
    void shouldPassValidContinuousPath() {
        // Hanks -> Catch Me If You Can -> Leo -> The Departed -> Damon
        List<SubmittedStep> path = List.of(
                new SubmittedStep("a_hanks", "m_catch", "a_leo"),
                new SubmittedStep("a_leo", "m_departed", "a_damon")
        );

        GameSubmission submission = new GameSubmission("user1", "a_hanks", "a_damon", path, 45);
        ValidationResult result = validator.validate(submission);

        assertThat(result.valid()).isTrue();
        assertThat(result.moves()).isEqualTo(2);
        assertThat(result.score()).isGreaterThan(0);
    }

    @Test
    @DisplayName("Should fail when start actor does not match first step")
    void shouldFailWhenStartActorMismatch() {
        List<SubmittedStep> path = List.of(
                new SubmittedStep("a_leo", "m_departed", "a_damon")
        );

        GameSubmission submission = new GameSubmission("user1", "a_hanks", "a_damon", path, 30);
        ValidationResult result = validator.validate(submission);

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).contains("Path start does not match");
    }

    @Test
    @DisplayName("Should fail when target actor does not match last step")
    void shouldFailWhenTargetActorMismatch() {
        List<SubmittedStep> path = List.of(
                new SubmittedStep("a_hanks", "m_catch", "a_leo")
        );

        GameSubmission submission = new GameSubmission("user1", "a_hanks", "a_damon", path, 30);
        ValidationResult result = validator.validate(submission);

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).contains("Path end does not match");
    }

    @Test
    @DisplayName("Should fail when path has broken continuity")
    void shouldFailWhenDiscontinuousChain() {
        List<SubmittedStep> path = List.of(
                new SubmittedStep("a_hanks", "m_catch", "a_leo"),
                // Discontinuity: previous toActor was a_leo, but next fromActor is a_bale
                new SubmittedStep("a_bale", "m_departed", "a_damon")
        );

        GameSubmission submission = new GameSubmission("user1", "a_hanks", "a_damon", path, 30);
        ValidationResult result = validator.validate(submission);

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).contains("Discontinuous connection");
    }

    @Test
    @DisplayName("Should fail when actor was not actually in the movie")
    void shouldFailWhenActorNotInMovie() {
        List<SubmittedStep> path = List.of(
                // a_bale was not in m_catch!
                new SubmittedStep("a_hanks", "m_catch", "a_bale"),
                new SubmittedStep("a_bale", "m_departed", "a_damon")
        );

        GameSubmission submission = new GameSubmission("user1", "a_hanks", "a_damon", path, 30);
        ValidationResult result = validator.validate(submission);

        assertThat(result.valid()).isFalse();
        assertThat(result.message()).contains("was not in movie");
    }
}
