package io.reelquest.game.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record HintResponse(
        String currentActorId,
        String currentActorName,
        String targetActorId,
        String targetActorName,
        int remainingHops,
        String riddleClue,
        String recommendedMovieId,
        String recommendedMovieTitle,
        int recommendedMovieYear,
        String recommendedMoviePoster,
        String nextActorId,
        String nextActorName,
        String nextActorImage,
        boolean isPro,
        int freeHintsRemaining
) {}
