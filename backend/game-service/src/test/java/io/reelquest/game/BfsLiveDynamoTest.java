package io.reelquest.game;

import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.DynamoDbGraphDataProvider;
import io.reelquest.domain.graph.ShortestPathResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import static org.assertj.core.api.Assertions.assertThat;

@EnabledIfEnvironmentVariable(named = "RUN_LIVE_TESTS", matches = "true")
class BfsLiveDynamoTest {

    @Test
    @DisplayName("Should find path between Leonardo DiCaprio and Samuel L Jackson via Django Unchained")
    void testDiCaprioToJackson() {
        try (DynamoDbClient client = DynamoDbClient.builder().region(Region.EU_CENTRAL_1).build()) {
            DynamoDbGraphDataProvider provider = new DynamoDbGraphDataProvider(client, "reelquest-dev-data");
            BidirectionalBfsFinder bfs = new BidirectionalBfsFinder(provider);

            ShortestPathResult result = bfs.findShortestPath("6193", "2231");

            assertThat(result.found()).isTrue();
            assertThat(result.degrees()).isEqualTo(1);
            assertThat(result.path()).hasSize(1);
            assertThat(result.path().getFirst().movieTitle()).isEqualTo("Django Unchained");
        }
    }

    @Test
    @DisplayName("Should find direct 1-degree connection between Christian Bale and Cillian Murphy")
    void testBaleToMurphy() {
        try (DynamoDbClient client = DynamoDbClient.builder().region(Region.EU_CENTRAL_1).build()) {
            DynamoDbGraphDataProvider provider = new DynamoDbGraphDataProvider(client, "reelquest-dev-data");
            BidirectionalBfsFinder bfs = new BidirectionalBfsFinder(provider);

            ShortestPathResult result = bfs.findShortestPath("3894", "2037");

            assertThat(result.found()).isTrue();
            assertThat(result.degrees()).isEqualTo(1);
            assertThat(result.path()).isNotEmpty();
        }
    }

    @Test
    @DisplayName("Should find direct 1-degree connection between Brad Pitt and Leonardo DiCaprio")
    void testPittToDiCaprio() {
        try (DynamoDbClient client = DynamoDbClient.builder().region(Region.EU_CENTRAL_1).build()) {
            DynamoDbGraphDataProvider provider = new DynamoDbGraphDataProvider(client, "reelquest-dev-data");
            BidirectionalBfsFinder bfs = new BidirectionalBfsFinder(provider);

            ShortestPathResult result = bfs.findShortestPath("287", "6193");

            assertThat(result.found()).isTrue();
            assertThat(result.degrees()).isEqualTo(1);
            assertThat(result.path()).isNotEmpty();
        }
    }
}
