package io.reelquest.domain.graph;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;

import java.util.List;
import java.util.Optional;

public interface GraphDataProvider {
    List<MovieActorEdge> findMoviesByActor(String actorId);
    List<MovieActorEdge> findActorsByMovie(String movieId);
    Optional<Actor> findActorById(String actorId);
    Optional<Movie> findMovieById(String movieId);
}
