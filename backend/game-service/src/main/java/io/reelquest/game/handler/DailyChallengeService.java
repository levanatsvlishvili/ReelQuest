package io.reelquest.game.handler;

import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.GraphDataProvider;
import io.reelquest.domain.graph.ShortestPathResult;
import io.reelquest.domain.model.Actor;
import io.reelquest.game.dto.DailyChallengeResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

public class DailyChallengeService {

    private final GraphDataProvider dataProvider;
    private final BidirectionalBfsFinder bfsFinder;

    public record ChallengePair(String startActorId, String targetActorId) {}

    private static final List<ChallengePair> CHALLENGE_POOL = List.of(
            new ChallengePair("nm0000158", "nm0000138"), // Tom Hanks -> Leonardo DiCaprio
            new ChallengePair("nm0000138", "nm0000134"), // Leonardo DiCaprio -> Robert De Niro
            new ChallengePair("nm0000093", "nm0000288"), // Brad Pitt -> Christian Bale
            new ChallengePair("nm0000199", "nm0000158"), // Al Pacino -> Tom Hanks
            new ChallengePair("nm0614165", "nm0000093"), // Cillian Murphy -> Brad Pitt
            new ChallengePair("nm0000375", "nm0000199"), // Robert Downey Jr. -> Al Pacino
            new ChallengePair("nm0000206", "nm0000354")  // Keanu Reeves -> Matt Damon
    );

    public DailyChallengeService(GraphDataProvider dataProvider, BidirectionalBfsFinder bfsFinder) {
        this.dataProvider = Objects.requireNonNull(dataProvider, "dataProvider must not be null");
        this.bfsFinder = Objects.requireNonNull(bfsFinder, "bfsFinder must not be null");
    }

    public DailyChallengeResponse getDailyChallenge(LocalDate date) {
        int index = Math.abs(date.toString().hashCode()) % CHALLENGE_POOL.size();
        ChallengePair pair = CHALLENGE_POOL.get(index);

        Actor startActor = dataProvider.findActorById(pair.startActorId())
                .orElse(new Actor(pair.startActorId(), "Unknown", 0.0, null));
        Actor targetActor = dataProvider.findActorById(pair.targetActorId())
                .orElse(new Actor(pair.targetActorId(), "Unknown", 0.0, null));

        ShortestPathResult shortestPath = bfsFinder.findShortestPath(pair.startActorId(), pair.targetActorId());

        return new DailyChallengeResponse(
                date.toString(),
                startActor,
                targetActor,
                shortestPath.degrees()
        );
    }
}
