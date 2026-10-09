package io.reelquest.domain.model;

import java.util.Objects;

public record Movie(
        String id,
        String title,
        int year,
        double rating,
        String posterPath,
        int voteCount
) {
    public Movie {
        Objects.requireNonNull(id, "Movie ID must not be null");
        Objects.requireNonNull(title, "Movie title must not be null");
    }

    public String partitionKey() {
        return "MOVIE#" + id;
    }

    public static final String METADATA_SORT_KEY = "METADATA";
}
