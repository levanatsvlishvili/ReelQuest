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
        Integer hostLiveMoves,
        String hostCurrentActor,
        String hostLastAction,
        String hostEmote,
        String hostPathSummary,
        Boolean hostForfeited,
        Integer guestLiveMoves,
        String guestCurrentActor,
        String guestLastAction,
        String guestEmote,
        String guestPathSummary,
        Boolean guestForfeited,
        Long countdownStartedAt,
        String nextDuelId,
        String status, // WAITING, IN_PROGRESS, COMPLETED
        String winnerId, // null, hostUserId, guestUserId, "TIE"
        String createdAt,
        String updatedAt
) {}
