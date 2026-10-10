package io.reelquest.domain.game;

public record SubmittedStep(
        String fromActorId,
        String movieId,
        String toActorId
) {}
