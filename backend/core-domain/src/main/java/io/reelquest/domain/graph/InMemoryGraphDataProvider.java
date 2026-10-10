package io.reelquest.domain.graph;

import io.reelquest.domain.model.Actor;
import io.reelquest.domain.model.Movie;
import io.reelquest.domain.model.MovieActorEdge;

import java.util.*;

public class InMemoryGraphDataProvider implements GraphDataProvider {

    private final Map<String, Actor> actors = new HashMap<>();
    private final Map<String, Movie> movies = new HashMap<>();
    private final Map<String, List<MovieActorEdge>> actorToMovies = new HashMap<>();
    private final Map<String, List<MovieActorEdge>> movieToActors = new HashMap<>();

    public void addActor(Actor actor) {
        actors.put(actor.id(), actor);
    }

    public void addMovie(Movie movie) {
        movies.put(movie.id(), movie);
    }

    public void addEdge(String actorId, String movieId, String character, int order) {
        MovieActorEdge edge = new MovieActorEdge(actorId, movieId, character, order);
        actorToMovies.computeIfAbsent(actorId, k -> new ArrayList<>()).add(edge);
        movieToActors.computeIfAbsent(movieId, k -> new ArrayList<>()).add(edge);
    }

    @Override
    public List<MovieActorEdge> findMoviesByActor(String actorId) {
        return actorToMovies.getOrDefault(actorId, List.of());
    }

    @Override
    public List<MovieActorEdge> findActorsByMovie(String movieId) {
        return movieToActors.getOrDefault(movieId, List.of());
    }

    @Override
    public Optional<Actor> findActorById(String actorId) {
        return Optional.ofNullable(actors.get(actorId));
    }

    @Override
    public Optional<Movie> findMovieById(String movieId) {
        return Optional.ofNullable(movies.get(movieId));
    }
}
