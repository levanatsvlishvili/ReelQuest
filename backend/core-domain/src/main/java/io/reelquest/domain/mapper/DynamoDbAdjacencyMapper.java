package io.reelquest.domain.mapper;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class DynamoDbAdjacencyMapper {

    private DynamoDbAdjacencyMapper() {}

    public static Map<String, AttributeValue> toItem(Movie movie) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS(movie.partitionKey()));
        item.put("SK", AttributeValue.fromS(Movie.METADATA_SORT_KEY));
        item.put("GSI1PK", AttributeValue.fromS("TITLE#" + movie.title()));
        item.put("GSI1SK", AttributeValue.fromS("YEAR#" + movie.year()));
        item.put("Type", AttributeValue.fromS("MOVIE"));

        item.put("id", AttributeValue.fromS(movie.id()));
        item.put("title", AttributeValue.fromS(movie.title()));
        item.put("year", AttributeValue.fromN(String.valueOf(movie.year())));
        item.put("rating", AttributeValue.fromN(String.valueOf(movie.rating())));
        item.put("voteCount", AttributeValue.fromN(String.valueOf(movie.voteCount())));

        if (movie.posterPath() != null && !movie.posterPath().isBlank()) {
            item.put("posterPath", AttributeValue.fromS(movie.posterPath()));
        }
        if (movie.overview() != null && !movie.overview().isBlank()) {
            item.put("overview", AttributeValue.fromS(movie.overview()));
        }
        if (movie.genres() != null && !movie.genres().isEmpty()) {
            item.put("genres", AttributeValue.fromL(movie.genres().stream().map(AttributeValue::fromS).toList()));
        }
        if (movie.director() != null && !movie.director().isBlank()) {
            item.put("director", AttributeValue.fromS(movie.director()));
        }
        if (movie.releaseDate() != null && !movie.releaseDate().isBlank()) {
            item.put("releaseDate", AttributeValue.fromS(movie.releaseDate()));
        }
        if (movie.backdropPath() != null && !movie.backdropPath().isBlank()) {
            item.put("backdropPath", AttributeValue.fromS(movie.backdropPath()));
        }

        return item;
    }

    public static Movie toMovie(Map<String, AttributeValue> item) {
        String id = item.get("id").s();
        String title = item.get("title").s();
        int year = Integer.parseInt(item.get("year").n());
        double rating = Double.parseDouble(item.get("rating").n());
        int voteCount = item.containsKey("voteCount") ? Integer.parseInt(item.get("voteCount").n()) : 0;
        String posterPath = item.containsKey("posterPath") ? item.get("posterPath").s() : null;
        String overview = item.containsKey("overview") ? item.get("overview").s() : null;

        List<String> genres = List.of();
        if (item.containsKey("genres")) {
            AttributeValue genresAttr = item.get("genres");
            if (genresAttr.hasL()) {
                genres = genresAttr.l().stream().map(AttributeValue::s).toList();
            } else if (genresAttr.hasSs()) {
                genres = genresAttr.ss();
            }
        }

        String director = item.containsKey("director") ? item.get("director").s() : null;
        String releaseDate = item.containsKey("releaseDate") ? item.get("releaseDate").s() : null;
        String backdropPath = item.containsKey("backdropPath") ? item.get("backdropPath").s() : null;

        return new Movie(id, title, year, rating, posterPath, voteCount, overview, genres, director, releaseDate, backdropPath);
    }

    public static Map<String, AttributeValue> toItem(Actor actor) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS(actor.partitionKey()));
        item.put("SK", AttributeValue.fromS(Actor.METADATA_SORT_KEY));
        item.put("GSI1PK", AttributeValue.fromS("NAME#" + actor.name()));
        item.put("GSI1SK", AttributeValue.fromS("POPULARITY#" + String.format("%.2f", actor.popularity())));
        item.put("Type", AttributeValue.fromS("ACTOR"));

        item.put("id", AttributeValue.fromS(actor.id()));
        item.put("name", AttributeValue.fromS(actor.name()));
        item.put("popularity", AttributeValue.fromN(String.valueOf(actor.popularity())));

        if (actor.profilePath() != null && !actor.profilePath().isBlank()) {
            item.put("profilePath", AttributeValue.fromS(actor.profilePath()));
        }
        if (actor.knownForDepartment() != null && !actor.knownForDepartment().isBlank()) {
            item.put("knownForDepartment", AttributeValue.fromS(actor.knownForDepartment()));
        }

        return item;
    }

    public static Actor toActor(Map<String, AttributeValue> item) {
        String id = item.get("id").s();
        String name = item.get("name").s();
        double popularity = Double.parseDouble(item.get("popularity").n());
        String profilePath = item.containsKey("profilePath") ? item.get("profilePath").s() : null;
        String knownForDepartment = item.containsKey("knownForDepartment") ? item.get("knownForDepartment").s() : null;

        return new Actor(id, name, popularity, profilePath, knownForDepartment);
    }


    public static Map<String, AttributeValue> toItem(MovieActorEdge edge) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("PK", AttributeValue.fromS(edge.actorPartitionKey()));
        item.put("SK", AttributeValue.fromS(edge.movieSortKey()));

        item.put("GSI1PK", AttributeValue.fromS(edge.movieGsi1PartitionKey()));
        item.put("GSI1SK", AttributeValue.fromS(edge.actorGsi1SortKey()));
        item.put("Type", AttributeValue.fromS("EDGE"));

        item.put("actorId", AttributeValue.fromS(edge.actorId()));
        item.put("movieId", AttributeValue.fromS(edge.movieId()));
        item.put("billingOrder", AttributeValue.fromN(String.valueOf(edge.billingOrder())));

        if (edge.character() != null && !edge.character().isBlank()) {
            item.put("character", AttributeValue.fromS(edge.character()));
        }

        return item;
    }

    public static MovieActorEdge toEdge(Map<String, AttributeValue> item) {
        String actorId = item.get("actorId").s();
        String movieId = item.get("movieId").s();
        int billingOrder = Integer.parseInt(item.get("billingOrder").n());
        String character = item.containsKey("character") ? item.get("character").s() : null;

        return new MovieActorEdge(actorId, movieId, character, billingOrder);
    }
}
