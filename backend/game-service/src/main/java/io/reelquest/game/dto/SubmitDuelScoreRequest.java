package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SubmitDuelScoreRequest(
        String playerId,
        String playerName,
        String role,
        int moves,
        long durationSeconds,
        Boolean forfeited,
        String pathSummary
) {
    public SubmitDuelScoreRequest(String playerId, String playerName, int moves, long durationSeconds) {
        this(playerId, playerName, null, moves, durationSeconds, false, null);
    }
}
