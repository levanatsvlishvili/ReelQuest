package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateDuelProgressRequest(
        String playerId,
        String role,
        int currentMoves,
        String currentActorName,
        String lastAction,
        String emote
) {}
