package io.reelquest.domain.graph;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BidirectionalBfsFinderTest {

    private InMemoryGraphDataProvider dataProvider;
    private BidirectionalBfsFinder bfsFinder;

    @BeforeEach
    void setUp() {
        dataProvider = new InMemoryGraphDataProvider();
        bfsFinder = new BidirectionalBfsFinder(dataProvider);

        // Actors
        dataProvider.addActor(new Actor("a_hanks", "Tom Hanks", 95.0, null));
        dataProvider.addActor(new Actor("a_leo", "Leonardo DiCaprio", 98.0, null));
        dataProvider.addActor(new Actor("a_damon", "Matt Damon", 92.0, null));
        dataProvider.addActor(new Actor("a_murphy", "Cillian Murphy", 96.0, null));
        dataProvider.addActor(new Actor("a_bale", "Christian Bale", 93.0, null));
        dataProvider.addActor(new Actor("a_isolated", "Isolated Actor", 50.0, null));

        // Movies
        dataProvider.addMovie(new Movie("m_catch", "Catch Me If You Can", 2002, 8.1, null, 100));
        dataProvider.addMovie(new Movie("m_departed", "The Departed", 2006, 8.5, null, 100));
        dataProvider.addMovie(new Movie("m_oppenheimer", "Oppenheimer", 2023, 8.9, null, 100));
        dataProvider.addMovie(new Movie("m_dark_knight", "The Dark Knight", 2008, 9.0, null, 100));

        // Graph Edges
        // Catch Me If You Can: Hanks + Leo
        dataProvider.addEdge("a_hanks", "m_catch", "Carl Hanratty", 1);
        dataProvider.addEdge("a_leo", "m_catch", "Frank Abagnale", 2);

        // The Departed: Leo + Damon
        dataProvider.addEdge("a_leo", "m_departed", "Billy Costigan", 1);
        dataProvider.addEdge("a_damon", "m_departed", "Colin Sullivan", 2);

        // Oppenheimer: Damon + Murphy
        dataProvider.addEdge("a_damon", "m_oppenheimer", "Leslie Groves", 1);
        dataProvider.addEdge("a_murphy", "m_oppenheimer", "J. Robert Oppenheimer", 2);

        // The Dark Knight: Murphy + Bale
        dataProvider.addEdge("a_murphy", "m_dark_knight", "Scarecrow", 1);
        dataProvider.addEdge("a_bale", "m_dark_knight", "Batman", 2);
    }

    @Test
    @DisplayName("Same actor should return 0 degrees and empty path")
    void sameActorReturnsZeroDegrees() {
        ShortestPathResult result = bfsFinder.findShortestPath("a_hanks", "a_hanks");

        assertThat(result.found()).isTrue();
        assertThat(result.degrees()).isEqualTo(0);
        assertThat(result.path()).isEmpty();
    }

    @Test
    @DisplayName("Direct co-stars should return 1 degree of separation")
    void directCoStarsReturnOneDegree() {
        ShortestPathResult result = bfsFinder.findShortestPath("a_hanks", "a_leo");

        assertThat(result.found()).isTrue();
        assertThat(result.degrees()).isEqualTo(1);
        assertThat(result.path()).hasSize(1);

        PathConnection connection = result.path().getFirst();
        assertThat(connection.fromActorId()).isEqualTo("a_hanks");
        assertThat(connection.toActorId()).isEqualTo("a_leo");
        assertThat(connection.movieId()).isEqualTo("m_catch");
        assertThat(connection.movieTitle()).isEqualTo("Catch Me If You Can");
    }

    @Test
    @DisplayName("Two degrees of separation should be found accurately")
    void twoDegreesSeparation() {
        // Hanks -> Leo -> Damon
        ShortestPathResult result = bfsFinder.findShortestPath("a_hanks", "a_damon");

        assertThat(result.found()).isTrue();
        assertThat(result.degrees()).isEqualTo(2);
        assertThat(result.path()).hasSize(2);

        assertThat(result.path().get(0).fromActorId()).isEqualTo("a_hanks");
        assertThat(result.path().get(0).toActorId()).isEqualTo("a_leo");
        assertThat(result.path().get(1).fromActorId()).isEqualTo("a_leo");
        assertThat(result.path().get(1).toActorId()).isEqualTo("a_damon");
    }

    @Test
    @DisplayName("Multi-degree path across multiple movies should resolve correctly")
    void multiDegreePathResolves() {
        // Hanks -> Leo -> Damon -> Murphy -> Bale (4 degrees)
        ShortestPathResult result = bfsFinder.findShortestPath("a_hanks", "a_bale");

        assertThat(result.found()).isTrue();
        assertThat(result.degrees()).isEqualTo(4);
        assertThat(result.path()).hasSize(4);

        assertThat(result.path().get(0).fromActorName()).isEqualTo("Tom Hanks");
        assertThat(result.path().get(3).toActorName()).isEqualTo("Christian Bale");
    }

    @Test
    @DisplayName("Isolated actor with no connections should return not found")
    void unconnectedActorsReturnNotFound() {
        ShortestPathResult result = bfsFinder.findShortestPath("a_hanks", "a_isolated");

        assertThat(result.found()).isFalse();
        assertThat(result.degrees()).isEqualTo(-1);
        assertThat(result.path()).isEmpty();
    }
}
