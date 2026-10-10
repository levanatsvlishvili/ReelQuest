package io.reelquest.domain.game;

public record ValidationResult(
        boolean valid,
        int moves,
        long score,
        String message
) {
    public static ValidationResult success(int moves, long score) {
        return new ValidationResult(true, moves, score, "Path successfully verified.");
    }

    public static ValidationResult failure(String reason) {
        return new ValidationResult(false, 0, 0, reason);
    }
}
