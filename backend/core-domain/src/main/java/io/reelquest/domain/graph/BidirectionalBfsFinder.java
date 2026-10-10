package io.reelquest.domain.graph;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;

import java.util.*;

public class BidirectionalBfsFinder {

    private final GraphDataProvider dataProvider;

    public BidirectionalBfsFinder(GraphDataProvider dataProvider) {
        this.dataProvider = Objects.requireNonNull(dataProvider, "dataProvider must not be null");
    }

    private record Step(String prevActorId, String movieId) {}

    public ShortestPathResult findShortestPath(String startActorId, String targetActorId) {
        long startTime = System.currentTimeMillis();

        if (startActorId == null || targetActorId == null) {
            return ShortestPathResult.empty(startActorId, targetActorId, 0);
        }

        if (startActorId.equals(targetActorId)) {
            return new ShortestPathResult(startActorId, targetActorId, 0, List.of(), 1, 0);
        }

        Queue<String> forwardQueue = new ArrayDeque<>();
        Queue<String> backwardQueue = new ArrayDeque<>();

        Map<String, Step> forwardParents = new HashMap<>();
        Map<String, Step> backwardParents = new HashMap<>();

        Set<String> forwardVisited = new HashSet<>();
        Set<String> backwardVisited = new HashSet<>();

        forwardQueue.add(startActorId);
        forwardVisited.add(startActorId);
        forwardParents.put(startActorId, new Step(null, null));

        backwardQueue.add(targetActorId);
        backwardVisited.add(targetActorId);
        backwardParents.put(targetActorId, new Step(null, null));

        long exploredNodes = 2;

        while (!forwardQueue.isEmpty() && !backwardQueue.isEmpty()) {
            boolean expandForward = forwardQueue.size() <= backwardQueue.size();

            Queue<String> currentQueue = expandForward ? forwardQueue : backwardQueue;
            Set<String> currentVisited = expandForward ? forwardVisited : backwardVisited;
            Set<String> oppositeVisited = expandForward ? backwardVisited : forwardVisited;
            Map<String, Step> currentParents = expandForward ? forwardParents : backwardParents;

            String currentActorId = currentQueue.poll();
            List<MovieActorEdge> movieEdges = dataProvider.findMoviesByActor(currentActorId);

            for (MovieActorEdge movieEdge : movieEdges) {
                String movieId = movieEdge.movieId();
                List<MovieActorEdge> coStarEdges = dataProvider.findActorsByMovie(movieId);

                for (MovieActorEdge coStarEdge : coStarEdges) {
                    String neighborActorId = coStarEdge.actorId();
                    if (neighborActorId.equals(currentActorId)) {
                        continue;
                    }

                    exploredNodes++;

                    if (oppositeVisited.contains(neighborActorId)) {
                        currentParents.put(neighborActorId, new Step(currentActorId, movieId));
                        long duration = System.currentTimeMillis() - startTime;
                        return buildResult(startActorId, targetActorId, neighborActorId, forwardParents, backwardParents, exploredNodes, duration);
                    }

                    if (!currentVisited.contains(neighborActorId)) {
                        currentVisited.add(neighborActorId);
                        currentParents.put(neighborActorId, new Step(currentActorId, movieId));
                        currentQueue.add(neighborActorId);
                    }
                }
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        return ShortestPathResult.empty(startActorId, targetActorId, duration);
    }

    private ShortestPathResult buildResult(
            String startActorId,
            String targetActorId,
            String intersectionActorId,
            Map<String, Step> forwardParents,
            Map<String, Step> backwardParents,
            long exploredNodes,
            long duration
    ) {
        List<PathConnection> forwardConnections = new ArrayList<>();
        String current = intersectionActorId;

        while (true) {
            Step step = forwardParents.get(current);
            if (step == null || step.prevActorId() == null) {
                break;
            }
            forwardConnections.add(createConnection(step.prevActorId(), step.movieId(), current));
            current = step.prevActorId();
        }
        Collections.reverse(forwardConnections);

        List<PathConnection> backwardConnections = new ArrayList<>();
        current = intersectionActorId;

        while (true) {
            Step step = backwardParents.get(current);
            if (step == null || step.prevActorId() == null) {
                break;
            }
            backwardConnections.add(createConnection(current, step.movieId(), step.prevActorId()));
            current = step.prevActorId();
        }

        List<PathConnection> fullPath = new ArrayList<>(forwardConnections);
        fullPath.addAll(backwardConnections);

        return new ShortestPathResult(
                startActorId,
                targetActorId,
                fullPath.size(),
                fullPath,
                exploredNodes,
                duration
        );
    }

    private PathConnection createConnection(String fromActorId, String movieId, String toActorId) {
        String fromName = dataProvider.findActorById(fromActorId).map(Actor::name).orElse(fromActorId);
        String toName = dataProvider.findActorById(toActorId).map(Actor::name).orElse(toActorId);
        String movieTitle = dataProvider.findMovieById(movieId).map(Movie::title).orElse(movieId);

        return new PathConnection(fromActorId, fromName, movieId, movieTitle, toActorId, toName);
    }
}
