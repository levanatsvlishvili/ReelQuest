package io.reelquest.game.dto;

public record LeaderboardEntry(
        String userId,
        String username,
        long score,
        int moves,
        long durationSeconds,
        boolean isPro,
        String updatedAt,
        boolean usedHint
) {
    public LeaderboardEntry(
            String userId,
            String username,
            long score,
            int moves,
            long durationSeconds,
            boolean isPro,
            String updatedAt
    ) {
        this(userId, username, score, moves, durationSeconds, isPro, updatedAt, false);
    }
}
