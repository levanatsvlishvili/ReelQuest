package io.reelquest.domain.mapper;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class DynamoDbAdjacencyMapperTest {

    @Test
    @DisplayName("Should correctly serialize and deserialize Movie node to DynamoDB item")
    void shouldMapMovieToDynamoDbItemAndBack() {
        Movie movie = new Movie(
                "tt0109830",
                "Forrest Gump",
                1994,
                8.8,
                "/arw2VCBveWOVZr6pxd9XTd1TdQa.jpg",
                2200000
        );

        Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(movie);

        assertThat(item.get("PK").s()).isEqualTo("MOVIE#tt0109830");
        assertThat(item.get("SK").s()).isEqualTo("METADATA");
        assertThat(item.get("GSI1PK").s()).isEqualTo("TITLE#Forrest Gump");
        assertThat(item.get("GSI1SK").s()).isEqualTo("YEAR#1994");
        assertThat(item.get("Type").s()).isEqualTo("MOVIE");
        assertThat(item.get("rating").n()).isEqualTo("8.8");

        Movie restored = DynamoDbAdjacencyMapper.toMovie(item);
        assertThat(restored).isEqualTo(movie);
    }

    @Test
    @DisplayName("Should correctly serialize and deserialize Actor node to DynamoDB item")
    void shouldMapActorToDynamoDbItemAndBack() {
        Actor actor = new Actor(
                "nm0000158",
                "Tom Hanks",
                95.4,
                "/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg"
        );

        Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(actor);

        assertThat(item.get("PK").s()).isEqualTo("ACTOR#nm0000158");
        assertThat(item.get("SK").s()).isEqualTo("METADATA");
        assertThat(item.get("GSI1PK").s()).isEqualTo("NAME#Tom Hanks");
        assertThat(item.get("Type").s()).isEqualTo("ACTOR");

        Actor restored = DynamoDbAdjacencyMapper.toActor(item);
        assertThat(restored).isEqualTo(actor);
    }

    @Test
    @DisplayName("Should correctly serialize Edge with GSI1 reverse index keys")
    void shouldMapEdgeToDynamoDbItemWithGsi1AndBack() {
        MovieActorEdge edge = new MovieActorEdge(
                "nm0000158",
                "tt0109830",
                "Forrest Gump",
                1
        );

        Map<String, AttributeValue> item = DynamoDbAdjacencyMapper.toItem(edge);

        assertThat(item.get("PK").s()).isEqualTo("ACTOR#nm0000158");
        assertThat(item.get("SK").s()).isEqualTo("MOVIE#tt0109830");

        assertThat(item.get("GSI1PK").s()).isEqualTo("MOVIE#tt0109830");
        assertThat(item.get("GSI1SK").s()).isEqualTo("ACTOR#nm0000158");
        assertThat(item.get("Type").s()).isEqualTo("EDGE");
        assertThat(item.get("character").s()).isEqualTo("Forrest Gump");
        assertThat(item.get("billingOrder").n()).isEqualTo("1");

        MovieActorEdge restored = DynamoDbAdjacencyMapper.toEdge(item);
        assertThat(restored).isEqualTo(edge);
    }
}
