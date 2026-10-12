package io.reelquest.domain.model;

import java.util.List;
import java.util.Objects;

public record Movie(
        String id,
        String title,
        int year,
        double rating,
        String posterPath,
        int voteCount,
        String overview,
        List<String> genres,
        String director,
        String releaseDate,
        String backdropPath
) {
    public Movie {
        Objects.requireNonNull(id, "Movie ID must not be null");
        Objects.requireNonNull(title, "Movie title must not be null");
        genres = genres != null ? List.copyOf(genres) : List.of();
    }

    public Movie(String id, String title, int year, double rating, String posterPath, int voteCount) {
        this(id, title, year, rating, posterPath, voteCount, null, List.of(), null, null, null);
    }

    public String partitionKey() {
        return "MOVIE#" + id;
    }

    public static final String METADATA_SORT_KEY = "METADATA";
}
