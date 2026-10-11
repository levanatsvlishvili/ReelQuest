package io.reelquest.game.dto;

public record LeaderboardEntry(
        String userId,
        long score,
        int moves,
        long durationSeconds,
        String updatedAt
) {}
