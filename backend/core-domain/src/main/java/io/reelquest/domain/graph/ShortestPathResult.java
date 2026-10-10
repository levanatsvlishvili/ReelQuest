package io.reelquest.domain.graph;

import java.util.List;

public record ShortestPathResult(
        String startActorId,
        String targetActorId,
        int degrees,
        List<PathConnection> path,
        long exploredNodesCount,
        long executionTimeMs
) {
    public static ShortestPathResult empty(String startActorId, String targetActorId, long executionTimeMs) {
        return new ShortestPathResult(startActorId, targetActorId, -1, List.of(), 0, executionTimeMs);
    }

    public boolean found() {
        return degrees >= 0;
    }
}
