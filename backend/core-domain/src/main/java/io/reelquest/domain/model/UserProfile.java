package io.reelquest.domain.model;

public record UserProfile(
        String userId,
        String username,
        String email,
        SubscriptionTier tier,
        int gamesPlayed,
        int gamesWon,
        int streak,
        int bestHops,
        long totalScore,
        String createdAt,
        String updatedAt
) {
    public static UserProfile createDefault(String userId, String username, String email, String timestamp) {
        return new UserProfile(
                userId,
                username,
                email,
                SubscriptionTier.FREE,
                0,
                0,
                0,
                0,
                0L,
                timestamp,
                timestamp
        );
    }

    public UserProfile withTier(SubscriptionTier newTier, String timestamp) {
        return new UserProfile(
                userId,
                username,
                email,
                newTier,
                gamesPlayed,
                gamesWon,
                streak,
                bestHops,
                totalScore,
                createdAt,
                timestamp
        );
    }
}
