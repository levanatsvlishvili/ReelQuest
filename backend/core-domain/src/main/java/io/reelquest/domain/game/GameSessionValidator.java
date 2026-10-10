package io.reelquest.domain.game;

import io.reelquest.domain.graph.GraphDataProvider;
import io.reelquest.domain.model.MovieActorEdge;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class GameSessionValidator {

    private final GraphDataProvider dataProvider;

    public GameSessionValidator(GraphDataProvider dataProvider) {
        this.dataProvider = Objects.requireNonNull(dataProvider, "dataProvider must not be null");
    }

    public ValidationResult validate(GameSubmission submission) {
        if (submission == null || submission.path() == null || submission.path().isEmpty()) {
            return ValidationResult.failure("Submission path cannot be empty.");
        }

        List<SubmittedStep> path = submission.path();

        if (!path.getFirst().fromActorId().equals(submission.startActorId())) {
            return ValidationResult.failure("Path start does not match the designated starting actor.");
        }

        if (!path.getLast().toActorId().equals(submission.targetActorId())) {
            return ValidationResult.failure("Path end does not match the designated target actor.");
        }

        for (int i = 0; i < path.size(); i++) {
            SubmittedStep current = path.get(i);

            if (i > 0) {
                SubmittedStep prev = path.get(i - 1);
                if (!prev.toActorId().equals(current.fromActorId())) {
                    return ValidationResult.failure("Discontinuous connection between steps " + i + " and " + (i + 1) + ".");
                }
            }

            List<MovieActorEdge> castEdges = dataProvider.findActorsByMovie(current.movieId());
            if (castEdges.isEmpty()) {
                return ValidationResult.failure("Movie " + current.movieId() + " not found or has no cast records.");
            }

            Set<String> actorIds = castEdges.stream()
                    .map(MovieActorEdge::actorId)
                    .collect(Collectors.toSet());

            if (!actorIds.contains(current.fromActorId())) {
                return ValidationResult.failure("Actor " + current.fromActorId() + " was not in movie " + current.movieId() + ".");
            }

            if (!actorIds.contains(current.toActorId())) {
                return ValidationResult.failure("Actor " + current.toActorId() + " was not in movie " + current.movieId() + ".");
            }
        }

        int moves = path.size();
        long score = calculateScore(moves, submission.durationSeconds());

        return ValidationResult.success(moves, score);
    }

    private long calculateScore(int moves, long durationSeconds) {
        long baseScore = 10_000;
        long movePenalty = (long) (moves - 1) * 1_200;
        long timePenalty = Math.min(durationSeconds * 20, 4_000);
        return Math.max(100, baseScore - movePenalty - timePenalty);
    }
}
