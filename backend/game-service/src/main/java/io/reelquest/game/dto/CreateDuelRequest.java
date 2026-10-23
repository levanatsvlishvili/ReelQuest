package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateDuelRequest(
        String startActorId,
        String targetActorId,
        String hostNickname
) {}
