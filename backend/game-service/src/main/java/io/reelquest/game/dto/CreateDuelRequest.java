package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateDuelRequest(
        String startActorId,
        String startActorName,
        String startActorImage,
        String targetActorId,
        String targetActorName,
        String targetActorImage,
        String hostUserId,
        String hostNickname
) {
    public CreateDuelRequest(String startActorId, String targetActorId, String hostNickname) {
        this(startActorId, null, null, targetActorId, null, null, null, hostNickname);
    }
}
