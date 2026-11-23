import { useState, useMemo } from 'react';
import { Film, User, Star, Search, Sparkles, X, ArrowLeft } from 'lucide-react';
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
  const [movieSort, setMovieSort] = useState('popular');
  const [castFilter, setCastFilter] = useState('');
  const [castSort, setCastSort] = useState('popular');

  const filteredMovies = useMemo(() => {
    const query = movieFilter.toLowerCase().trim();
    const list = availableMovies.filter((m) =>
      m.title.toLowerCase().includes(query)
    );
    if (movieSort === 'newest') {
      return [...list].sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
    }
    if (movieSort === 'az') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [availableMovies, movieFilter, movieSort]);

  const filteredCast = useMemo(() => {
    const query = castFilter.toLowerCase().trim();
    const list = availableCast.filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        (a.character && a.character.toLowerCase().includes(query))
    );
    if (castSort === 'az') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [availableCast, castFilter, castSort]);

  return (
    <div className="space-y-4">
      {!selectedMovie ? (
        <section className="space-y-3.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                {currentActor?.name}&apos;s Films
              </h3>
              <span className="text-xs text-cinema-muted">
                {availableMovies.length} verified credits
              </span>
            </div>

            {availableMovies.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search film..."
                    value={movieFilter}
                    onChange={(e) => setMovieFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-cinema-surface py-1.5 pl-8 pr-7 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-gold/60"
                  />
                  {movieFilter && (
                    <button
                      type="button"
                      onClick={() => setMovieFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={movieSort}
                  onChange={(e) => setMovieSort(e.target.value)}
                  className="rounded-lg border border-white/[0.08] bg-cinema-surface py-1.5 px-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-gold/60 cursor-pointer"
                  aria-label="Sort films"
                >
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                  <option value="az">A–Z</option>
                </select>
              </div>
            )}
          </div>

          {moviesLoading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
              <div className="h-7 w-7 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-xs text-cinema-muted">Loading filmography...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMovies.map((movie) => (
                <button
                  type="button"
                  key={movie.id}
                  onClick={() => onSelectMovie(movie)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-cinema-surface text-left transition hover:border-gold/50 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-cinema-card">
                    {movie.posterPath ? (
                      <img
                        src={getTmdbImageUrl(movie.posterPath)}
                        alt={movie.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                        <Film className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                    {movie.rating && (
                      <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-amber-300 backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5 fill-amber-300" />
                        <span>{movie.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-2.5">
                    <h4 className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-gold transition">
                      {movie.title}
                    </h4>
                    <span className="text-[11px] text-cinema-muted">{movie.year}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!moviesLoading && filteredMovies.length === 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-cinema-surface/50 p-8 text-center">
              <Film className="mx-auto h-7 w-7 text-cinema-muted opacity-50" />
              <p className="mt-2 text-xs text-cinema-muted">No films match your search filter.</p>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.08] bg-cinema-surface px-3.5 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onClearMovie}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-cinema-card text-slate-300 hover:border-gold/50 hover:text-gold transition"
                title="Back to filmography"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="h-11 w-8 shrink-0 overflow-hidden rounded bg-cinema-card">
                {selectedMovie.posterPath ? (
                  <img
                    src={getTmdbImageUrl(selectedMovie.posterPath)}
                    alt={selectedMovie.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                    <Film className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {selectedMovie.title} <span className="text-cinema-muted font-normal">({selectedMovie.year})</span>
                </h4>
                <p className="text-xs text-cinema-muted truncate">
                  Pick a co-star toward <strong className="text-gold font-semibold">{targetActor?.name}</strong>
                </p>
              </div>
            </div>

            {availableCast.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter cast..."
                    value={castFilter}
                    onChange={(e) => setCastFilter(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-cinema-card py-1.5 pl-8 pr-7 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-gold/60"
                  />
                  {castFilter && (
                    <button
                      type="button"
                      onClick={() => setCastFilter('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={castSort}
                  onChange={(e) => setCastSort(e.target.value)}
                  className="rounded-lg border border-white/[0.08] bg-cinema-card py-1.5 px-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-gold/60 cursor-pointer"
                  aria-label="Sort cast"
                >
                  <option value="popular">Featured</option>
                  <option value="az">A–Z</option>
                </select>
              </div>
            )}
          </div>

          {castLoading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
              <div className="h-7 w-7 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <p className="text-xs text-cinema-muted">Loading co-stars...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredCast.map((actor) => {
                const isTarget = targetActor && actor.id === targetActor.id;

                return (
                  <button
                    type="button"
                    key={actor.id}
                    onClick={() => onSelectActor(actor)}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isTarget
                        ? 'border-gold bg-gold/10 ring-1 ring-gold/60'
                        : 'border-white/[0.07] bg-cinema-surface hover:border-gold/50 hover:-translate-y-0.5'
                    }`}
                  >
                    {isTarget && (
                      <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cinema-black">
                        <Sparkles className="h-3 w-3" />
                        <span>Target</span>
                      </div>
                    )}

                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-cinema-card">
                      {actor.profilePath ? (
                        <img
                          src={getTmdbImageUrl(actor.profilePath)}
                          alt={actor.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                          <User className="h-9 w-9 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-2.5">
                      <div>
                        <h4
                          className={`text-xs font-semibold line-clamp-1 ${
                            isTarget ? 'text-gold font-bold' : 'text-slate-100 group-hover:text-gold'
                          }`}
                        >
                          {actor.name}
                        </h4>
                        {actor.character && (
                          <p className="text-[11px] text-cinema-muted line-clamp-1">
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
            <div className="rounded-xl border border-white/[0.07] bg-cinema-surface/50 p-8 text-center">
              <User className="mx-auto h-7 w-7 text-cinema-muted opacity-50" />
              <p className="mt-2 text-xs text-cinema-muted">No co-stars match your search filter.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
