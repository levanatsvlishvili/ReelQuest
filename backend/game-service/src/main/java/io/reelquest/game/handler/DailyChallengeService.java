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
            new ChallengePair("31", "6193"),    // Tom Hanks -> Leonardo DiCaprio
            new ChallengePair("6193", "380"),   // Leonardo DiCaprio -> Robert De Niro
            new ChallengePair("287", "3894"),   // Brad Pitt -> Christian Bale
            new ChallengePair("1158", "31"),    // Al Pacino -> Tom Hanks
            new ChallengePair("2037", "287"),   // Cillian Murphy -> Brad Pitt
            new ChallengePair("3223", "1158"),  // Robert Downey Jr. -> Al Pacino
            new ChallengePair("6384", "1892"),  // Keanu Reeves -> Matt Damon
            new ChallengePair("500", "2231"),   // Tom Cruise -> Samuel L. Jackson
            new ChallengePair("1245", "3894"),  // Scarlett Johansson -> Christian Bale
            new ChallengePair("192", "31")      // Morgan Freeman -> Tom Hanks
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
