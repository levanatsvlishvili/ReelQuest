package io.reelquest.domain.game;

import java.util.List;

public record GameSubmission(
        String userId,
        String startActorId,
        String targetActorId,
        List<SubmittedStep> path,
        long durationSeconds
) {}
