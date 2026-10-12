import { useState } from 'react';
import { Film, User, Star, Search, Sparkles, X } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';

export function ChainBuilder({
  currentActor,
  selectedMovie,
  availableMovies = [],
  availableCast = [],
  moviesLoading = false,
  castLoading = false,
  targetActor,
  onSelectMovie,
  onClearMovie,
  onSelectActor
}) {
  const [movieFilter, setMovieFilter] = useState('');
  const [castFilter, setCastFilter] = useState('');

  const filteredMovies = availableMovies.filter(m =>
    m.title.toLowerCase().includes(movieFilter.toLowerCase())
  );

  const filteredCast = availableCast.filter(a =>
    a.name.toLowerCase().includes(castFilter.toLowerCase()) ||
    (a.character && a.character.toLowerCase().includes(castFilter.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* If no movie is selected, show filmography of current actor */}
      {!selectedMovie ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                  1
                </span>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Select a film featuring <span className="text-gold">{currentActor?.name}</span>
                </h3>
              </div>
              <p className="text-xs text-cinema-muted">
                Choose a movie from their filmography to branch out to new co-stars.
              </p>
            </div>

            {availableMovies.length > 4 && (
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="text"
                  placeholder="Filter movies..."
                  value={movieFilter}
                  onChange={e => setMovieFilter(e.target.value)}
                  className="w-full rounded-lg border border-cinema-border bg-cinema-surface py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          {moviesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-xs text-cinema-muted">Loading filmography...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMovies.map(movie => (
                <button
                  key={movie.id}
                  onClick={() => onSelectMovie(movie)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-cinema-border bg-cinema-card text-left transition hover:border-gold/60 hover:shadow-gold-glow"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-surface">
                    {movie.posterPath ? (
                      <img
                        src={getTmdbImageUrl(movie.posterPath)}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                        <Film className="h-8 w-8" />
                      </div>
                    )}
                    {movie.rating && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-sm border border-amber-500/30">
                        <Star className="h-2.5 w-2.5 fill-amber-300" />
                        <span>{movie.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-2.5">
                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-gold">
                      {movie.title}
                    </h4>
                    <span className="text-[10px] text-cinema-muted">{movie.year}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!moviesLoading && filteredMovies.length === 0 && (
            <div className="rounded-xl border border-cinema-border bg-cinema-surface/50 p-8 text-center">
              <Film className="mx-auto h-8 w-8 text-cinema-muted" />
              <p className="mt-2 text-xs text-cinema-muted">No films match your search filter.</p>
            </div>
          )}
        </section>
      ) : (
        /* Movie is selected, pick co-star */
        <section className="space-y-4">
          {/* Active movie banner */}
          <div className="flex items-center justify-between rounded-xl border border-gold/40 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-cinema-border">
                {selectedMovie.posterPath ? (
                  <img
                    src={getTmdbImageUrl(selectedMovie.posterPath)}
                    alt={selectedMovie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                    <Film className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                  Selected Movie
                </span>
                <h4 className="text-sm font-bold text-white sm:text-base">{selectedMovie.title} ({selectedMovie.year})</h4>
                <p className="text-xs text-cinema-muted">
                  Starring <strong className="text-slate-200">{currentActor?.name}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClearMovie}
              className="flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-cinema-muted hover:text-white"
            >
              <X className="h-3 w-3" />
              <span>Change Film</span>
            </button>
          </div>

          {/* Co-star selection */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
                  2
                </span>
                <h3 className="text-base font-bold text-white sm:text-lg">
                  Pick a co-star from <span className="text-gold">{selectedMovie.title}</span>
                </h3>
              </div>
              <p className="text-xs text-cinema-muted">
                Connect through any co-star to continue your journey toward <strong className="text-gold">{targetActor?.name}</strong>.
              </p>
            </div>

            {availableCast.length > 4 && (
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cinema-muted" />
                <input
                  type="text"
                  placeholder="Filter cast..."
                  value={castFilter}
                  onChange={e => setCastFilter(e.target.value)}
                  className="w-full rounded-lg border border-cinema-border bg-cinema-surface py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>
            )}
          </div>

          {castLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-xs text-cinema-muted">Loading co-stars...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredCast.map(actor => {
                const isTarget = targetActor && actor.id === targetActor.id;

                return (
                  <button
                    key={actor.id}
                    onClick={() => onSelectActor(actor)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isTarget
                        ? 'border-gold bg-gold/15 shadow-gold-glow ring-2 ring-gold/50 animate-pulse'
                        : 'border-cinema-border bg-cinema-card hover:border-gold/60 hover:shadow-gold-glow'
                    }`}
                  >
                    {isTarget && (
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-cinema-black shadow-md">
                        <Sparkles className="h-3 w-3" />
                        <span>Target Goal</span>
                      </div>
                    )}

                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-cinema-surface">
                      {actor.profilePath ? (
                        <img
                          src={getTmdbImageUrl(actor.profilePath)}
                          alt={actor.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                          <User className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-2.5">
                      <div>
                        <h4 className={`text-xs font-semibold line-clamp-1 ${
                          isTarget ? 'text-gold font-bold' : 'text-slate-100 group-hover:text-gold'
                        }`}>
                          {actor.name}
                        </h4>
                        {actor.character && (
                          <p className="text-[10px] text-cinema-muted line-clamp-1">
                            as {actor.character}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!castLoading && filteredCast.length === 0 && (
            <div className="rounded-xl border border-cinema-border bg-cinema-surface/50 p-8 text-center">
              <User className="mx-auto h-8 w-8 text-cinema-muted" />
              <p className="mt-2 text-xs text-cinema-muted">No co-stars match your search filter.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
