package io.reelquest.domain.graph;

public record PathConnection(
        String fromActorId,
        String fromActorName,
        String movieId,
        String movieTitle,
        String toActorId,
        String toActorName
) {}
