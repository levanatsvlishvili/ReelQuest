package io.reelquest.domain.graph;

import io.reelquest.domain.mapper.DynamoDbAdjacencyMapper;
import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

public class DynamoDbGraphDataProvider implements GraphDataProvider {

    private final DynamoDbClient client;
    private final String tableName;

    public DynamoDbGraphDataProvider(DynamoDbClient client, String tableName) {
        this.client = Objects.requireNonNull(client, "client must not be null");
        this.tableName = Objects.requireNonNull(tableName, "tableName must not be null");
    }

    @Override
    public List<MovieActorEdge> findMoviesByActor(String actorId) {
        QueryRequest request = QueryRequest.builder()
                .tableName(tableName)
                .keyConditionExpression("PK = :pk AND begins_with(SK, :moviePrefix)")
                .expressionAttributeValues(Map.of(
                        ":pk", AttributeValue.fromS("ACTOR#" + actorId),
                        ":moviePrefix", AttributeValue.fromS("MOVIE#")
                ))
                .build();

        return client.query(request).items().stream()
                .map(DynamoDbAdjacencyMapper::toEdge)
                .toList();
    }

    @Override
    public List<MovieActorEdge> findActorsByMovie(String movieId) {
        QueryRequest request = QueryRequest.builder()
                .tableName(tableName)
                .indexName("GSI1")
                .keyConditionExpression("GSI1PK = :gsi1pk AND begins_with(GSI1SK, :actorPrefix)")
                .expressionAttributeValues(Map.of(
                        ":gsi1pk", AttributeValue.fromS("MOVIE#" + movieId),
                        ":actorPrefix", AttributeValue.fromS("ACTOR#")
                ))
                .build();

        return client.query(request).items().stream()
                .map(DynamoDbAdjacencyMapper::toEdge)
                .toList();
    }

    @Override
    public Optional<Actor> findActorById(String actorId) {
        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("ACTOR#" + actorId),
                        "SK", AttributeValue.fromS(Actor.METADATA_SORT_KEY)
                ))
                .build();

        var response = client.getItem(request);
        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(DynamoDbAdjacencyMapper.toActor(response.item()));
    }

    @Override
    public Optional<Movie> findMovieById(String movieId) {
        GetItemRequest request = GetItemRequest.builder()
                .tableName(tableName)
                .key(Map.of(
                        "PK", AttributeValue.fromS("MOVIE#" + movieId),
                        "SK", AttributeValue.fromS(Movie.METADATA_SORT_KEY)
                ))
                .build();

        var response = client.getItem(request);
        if (!response.hasItem() || response.item().isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(DynamoDbAdjacencyMapper.toMovie(response.item()));
    }
}
