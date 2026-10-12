package io.reelquest.domain.model;

import java.util.Objects;

public record Actor(
        String id,
        String name,
        double popularity,
        String profilePath,
        String knownForDepartment
) {
    public Actor {
        Objects.requireNonNull(id, "Actor ID must not be null");
        Objects.requireNonNull(name, "Actor name must not be null");
    }

    public Actor(String id, String name, double popularity, String profilePath) {
        this(id, name, popularity, profilePath, null);
    }

    public String partitionKey() {
        return "ACTOR#" + id;
    }

    public static final String METADATA_SORT_KEY = "METADATA";
}
