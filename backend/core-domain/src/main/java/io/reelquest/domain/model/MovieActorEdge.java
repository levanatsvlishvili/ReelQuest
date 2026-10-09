package io.reelquest.domain.model;

import java.util.Objects;

public record MovieActorEdge(
        String actorId,
        String movieId,
        String character,
        int billingOrder
) {
    public MovieActorEdge {
        Objects.requireNonNull(actorId, "Actor ID must not be null");
        Objects.requireNonNull(movieId, "Movie ID must not be null");
    }

    public String actorPartitionKey() {
        return "ACTOR#" + actorId;
    }

    public String movieSortKey() {
        return "MOVIE#" + movieId;
    }

    public String movieGsi1PartitionKey() {
        return "MOVIE#" + movieId;
    }

    public String actorGsi1SortKey() {
        return "ACTOR#" + actorId;
    }
}
