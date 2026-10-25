package io.reelquest.game.handler;

import io.reelquest.domain.graph.BidirectionalBfsFinder;
import io.reelquest.domain.graph.GraphDataProvider;
import io.reelquest.domain.graph.ShortestPathResult;
import io.reelquest.domain.model.Actor;
import io.reelquest.game.dto.DailyChallengeResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

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

    private static final List<String> RANDOM_ACTOR_POOL = List.of(
            "31", "6193", "380", "287", "3894", "1158", "2037", "3223",
            "6384", "1892", "500", "2231", "1245", "192", "5292", "1813",
            "30614", "54693", "74568", "16828", "524", "85", "6968", "71580",
            "3", "2888", "10297", "131", "234352", "1190668", "103", "51329",
            "10859", "64", "2524", "11288", "2963", "819", "17605", "16851"
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

    public DailyChallengeResponse getRandomChallenge() {
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        for (int attempt = 0; attempt < 8; attempt++) {
            String startId = RANDOM_ACTOR_POOL.get(rng.nextInt(RANDOM_ACTOR_POOL.size()));
            String targetId = RANDOM_ACTOR_POOL.get(rng.nextInt(RANDOM_ACTOR_POOL.size()));
            if (startId.equals(targetId)) continue;

            Optional<Actor> startOpt = dataProvider.findActorById(startId);
            Optional<Actor> targetOpt = dataProvider.findActorById(targetId);
            if (startOpt.isPresent() && targetOpt.isPresent()) {
                ShortestPathResult path = bfsFinder.findShortestPath(startId, targetId);
                if (path != null && path.degrees() >= 1 && path.degrees() <= 6) {
                    return new DailyChallengeResponse(
                            "random",
                            startOpt.get(),
                            targetOpt.get(),
                            path.degrees()
                    );
                }
            }
        }

        // Fallback to a random ChallengePair from CHALLENGE_POOL
        ChallengePair pair = CHALLENGE_POOL.get(rng.nextInt(CHALLENGE_POOL.size()));
        Actor startActor = dataProvider.findActorById(pair.startActorId())
                .orElse(new Actor(pair.startActorId(), "Tom Hanks", 95.0, null));
        Actor targetActor = dataProvider.findActorById(pair.targetActorId())
                .orElse(new Actor(pair.targetActorId(), "Leonardo DiCaprio", 98.0, null));
        ShortestPathResult shortestPath = bfsFinder.findShortestPath(pair.startActorId(), pair.targetActorId());
        int degrees = (shortestPath != null && shortestPath.degrees() > 0) ? shortestPath.degrees() : 2;

        return new DailyChallengeResponse(
                "random",
                startActor,
                targetActor,
                degrees
        );
    }
}
