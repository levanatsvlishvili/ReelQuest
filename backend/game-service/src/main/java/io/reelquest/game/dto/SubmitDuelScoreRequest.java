package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SubmitDuelScoreRequest(
        String playerId,
        String playerName,
        int moves,
        long durationSeconds
) {}
