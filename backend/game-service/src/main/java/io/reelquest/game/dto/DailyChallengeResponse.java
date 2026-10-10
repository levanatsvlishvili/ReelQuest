package io.reelquest.game.dto;

import io.reelquest.domain.model.Actor;

public record DailyChallengeResponse(
        String date,
        Actor startActor,
        Actor targetActor,
        int optimalDegrees
) {}
