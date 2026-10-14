package io.reelquest.game.dto;

public record LeaderboardEntry(
        String userId,
        String username,
        long score,
        int moves,
        long durationSeconds,
        boolean isPro,
        String updatedAt
) {}
