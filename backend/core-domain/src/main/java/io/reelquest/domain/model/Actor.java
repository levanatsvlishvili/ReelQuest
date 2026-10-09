package io.reelquest.domain.model;

import java.util.Objects;

public record Actor(
        String id,
        String name,
        double popularity,
        String profilePath
) {
    public Actor {
        Objects.requireNonNull(id, "Actor ID must not be null");
        Objects.requireNonNull(name, "Actor name must not be null");
    }

    public String partitionKey() {
        return "ACTOR#" + id;
    }

    public static final String METADATA_SORT_KEY = "METADATA";
}
