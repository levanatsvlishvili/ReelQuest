package io.reelquest.game.dto;

import io.reelquest.domain.model.Actor;

public record DuelResponse(
        String duelId,
        String hostUserId,
        String hostUsername,
        String guestUserId,
        String guestUsername,
        Actor startActor,
        Actor targetActor,
        int optimalHops,
        Integer hostMoves,
        Long hostDurationSeconds,
        Integer guestMoves,
        Long guestDurationSeconds,
        String status, // WAITING, IN_PROGRESS, COMPLETED
        String winnerId, // null, hostUserId, guestUserId, "TIE"
        String createdAt,
        String updatedAt
) {}
