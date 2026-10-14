import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  Shuffle,
  RotateCcw,
  Crown,
  Play,
  Film,
  User,
  CheckCircle2,
  Lock,
  Layers,
  Zap
} from 'lucide-react';
import { fetchPopularActors, fetchOptimalPath, getTmdbImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function CustomPathFinder({ onOpenPro, onPlayCustomChallenge }) {
  const { user } = useAuth();
  const isPro = !!user?.isPro;

  const [actorsList, setActorsList] = useState([]);
  const [loadingActors, setLoadingActors] = useState(true);

  const [startQuery, setStartQuery] = useState('');
  const [targetQuery, setTargetQuery] = useState('');
  const [startActor, setStartActor] = useState(null);
  const [targetActor, setTargetActor] = useState(null);

  const [startDropdownOpen, setStartDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  const [calculating, setCalculating] = useState(false);
  const [pathResult, setPathResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchPopularActors()
      .then((data) => {
        setActorsList(data || []);
        setLoadingActors(false);
      })
      .catch(() => setLoadingActors(false));
  }, []);

  const filterActors = (query) => {
    if (!query || query.trim().length === 0) return actorsList.slice(0, 8);
    const q = query.toLowerCase().trim();
    return actorsList
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 10);
  };

  const handleSwap = () => {
    const tempActor = startActor;
    setStartActor(targetActor);
    setTargetActor(tempActor);
    setStartQuery(targetActor ? targetActor.name : '');
    setTargetQuery(tempActor ? tempActor.name : '');
    setPathResult(null);
  };

  const handleRandomize = () => {
    if (actorsList.length < 2) return;
    const idx1 = Math.floor(Math.random() * Math.min(200, actorsList.length));
    let idx2 = Math.floor(Math.random() * Math.min(200, actorsList.length));
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * Math.min(200, actorsList.length));
    }
    const a1 = actorsList[idx1];
    const a2 = actorsList[idx2];

    setStartActor(a1);
    setStartQuery(a1.name);
    setTargetActor(a2);
    setTargetQuery(a2.name);
    setPathResult(null);
    setErrorMsg('');
  };

  const handleCalculatePath = async () => {
    if (!startActor || !targetActor) {
      setErrorMsg('Please select both a starting and target actor.');
      return;
    }
    if (startActor.id === targetActor.id) {
      setErrorMsg('Please choose two different actors.');
      return;
    }

    setCalculating(true);
    setErrorMsg('');
    setPathResult(null);

    try {
      const result = await fetchOptimalPath(startActor.id, targetActor.id);
      if (result && Array.isArray(result) && result.length > 0) {
        setPathResult(result);
      } else {
        setErrorMsg('No direct path found within 6 degrees in our curated graph.');
      }
    } catch (err) {
      setErrorMsg('Failed to calculate shortest path. Please try another pair.');
    } finally {
      setCalculating(false);
    }
  };

  if (!isPro) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-8 shadow-2xl">
          {/* Subtle gold glow behind card */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold shadow-gold-glow">
              <Crown className="h-4 w-4 fill-gold" />
              <span>REELQUEST PRO EXCLUSIVE</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Custom Hollywood <span className="text-gold">Path Finder</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Connect <strong className="text-white">ANY two actors in cinema history</strong> from our database of 37,000+ stars. Our Bidirectional BFS Graph Engine discovers the shortest chain of movies and co-stars in seconds.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-left">
              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-4 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold mb-2.5">
                  <Search className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-white">37,000+ Actors</h4>
                <p className="text-[11px] text-cinema-muted mt-1">
                  Choose from Hollywood legends to modern indie stars.
                </p>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-4 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold mb-2.5">
                  <Zap className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-white">BFS Shortest Path</h4>
                <p className="text-[11px] text-cinema-muted mt-1">
                  Computes the mathematically optimal degrees of separation.
                </p>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-4 backdrop-blur-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold mb-2.5">
                  <Play className="h-4 w-4" />
                </div>
                <h4 className="text-xs font-bold text-white">Play Custom Pairs</h4>
                <p className="text-[11px] text-cinema-muted mt-1">
                  Turn any actor pair into an interactive game for you and friends.
                </p>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onOpenPro}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-7 py-3.5 text-sm font-bold text-cinema-black shadow-gold-glow hover:opacity-95 transition transform hover:scale-[1.02]"
              >
                <Crown className="h-4 w-4 fill-cinema-black" />
                <span>Unlock with PRO — $4.99/mo (Sandbox)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PRO User View
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 animate-fade-in space-y-8">
      {/* Studio Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-bold text-gold">
          <Crown className="h-3.5 w-3.5 fill-gold" />
          <span>PRO PATH EXPLORER</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Shortest Hollywood Path Finder
        </h2>
        <p className="text-xs sm:text-sm text-cinema-muted">
          Pick any two actors from our database of 37,000+ stars to compute their optimal connection
        </p>
      </div>

      {/* Input Selection Card */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
          {/* Start Actor Picker */}
          <div className="relative space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Start Actor</span>
              {startActor && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </label>
            <div className="relative">
              <input
                type="text"
                value={startQuery}
                onFocus={() => setStartDropdownOpen(true)}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  setStartActor(null);
                  setStartDropdownOpen(true);
                }}
                placeholder="Search start actor (e.g. Cillian Murphy)..."
                className="w-full rounded-xl border border-cinema-border/80 bg-cinema-surface py-2.5 pl-3.5 pr-10 text-sm text-white placeholder-cinema-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
            </div>

            {/* Dropdown */}
            {startDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-cinema-border bg-cinema-card shadow-2xl p-1.5 space-y-1">
                {filterActors(startQuery).map((actor) => (
                  <button
                    key={actor.id}
                    type="button"
                    onClick={() => {
                      setStartActor(actor);
                      setStartQuery(actor.name);
                      setStartDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-cinema-surface/80 text-left transition"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-cinema-border/60 shrink-0">
                      {actor.profilePath ? (
                        <img
                          src={getTmdbImageUrl(actor.profilePath)}
                          alt={actor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-cinema-muted text-xs">
                          {actor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">{actor.name}</div>
                      <div className="text-[10px] text-cinema-muted">Star • Pop {Math.round(actor.popularity)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center Swap & Randomize Controls */}
          <div className="flex md:flex-col items-center justify-center gap-2 pt-2 md:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap Start & Target"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-gold transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRandomize}
              title="Randomize Pair"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-gold transition"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>

          {/* Target Actor Picker */}
          <div className="relative space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Target Actor</span>
              {targetActor && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </label>
            <div className="relative">
              <input
                type="text"
                value={targetQuery}
                onFocus={() => setTargetDropdownOpen(true)}
                onChange={(e) => {
                  setTargetQuery(e.target.value);
                  setTargetActor(null);
                  setTargetDropdownOpen(true);
                }}
                placeholder="Search target actor (e.g. Brad Pitt)..."
                className="w-full rounded-xl border border-cinema-border/80 bg-cinema-surface py-2.5 pl-3.5 pr-10 text-sm text-white placeholder-cinema-muted focus:border-gold/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
            </div>

            {/* Dropdown */}
            {targetDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-cinema-border bg-cinema-card shadow-2xl p-1.5 space-y-1">
                {filterActors(targetQuery).map((actor) => (
                  <button
                    key={actor.id}
                    type="button"
                    onClick={() => {
                      setTargetActor(actor);
                      setTargetQuery(actor.name);
                      setTargetDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-cinema-surface/80 text-left transition"
                  >
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-cinema-border/60 shrink-0">
                      {actor.profilePath ? (
                        <img
                          src={getTmdbImageUrl(actor.profilePath)}
                          alt={actor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-cinema-muted text-xs">
                          {actor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">{actor.name}</div>
                      <div className="text-[10px] text-cinema-muted">Star • Pop {Math.round(actor.popularity)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-cinema-border/50">
          <div className="text-xs text-cinema-muted flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>Searchable pool: 3,500+ prominent Hollywood stars</span>
          </div>

          <button
            onClick={handleCalculatePath}
            disabled={!startActor || !targetActor || calculating}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-6 py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {calculating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cinema-black border-t-transparent" />
                <span>Exploring Graph Nodes...</span>
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 fill-cinema-black" />
                <span>Find Shortest Path</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Path Results */}
      {pathResult && (
        <div className="rounded-2xl border border-gold/40 bg-cinema-card p-6 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cinema-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Optimal Path Found</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {pathResult.length} {pathResult.length === 1 ? 'Degree' : 'Degrees'} of Separation
                </span>
              </div>
              <p className="text-xs text-cinema-muted mt-0.5">
                Connecting {startActor?.name} to {targetActor?.name}
              </p>
            </div>

            {onPlayCustomChallenge && (
              <button
                onClick={() => {
                  onPlayCustomChallenge({
                    startActor,
                    targetActor,
                    optimalHops: pathResult.length,
                    challengeId: `custom-${startActor.id}-${targetActor.id}`
                  });
                }}
                className="flex items-center gap-2 rounded-xl bg-gold/20 border border-gold/40 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/30 transition"
              >
                <Play className="h-3.5 w-3.5 fill-gold" />
                <span>Play This Challenge</span>
              </button>
            )}
          </div>

          {/* Visual Step-by-Step Chain */}
          <div className="space-y-3">
            {pathResult.map((step, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/50"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-gold text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="truncate font-semibold text-xs text-white">
                    {step.actor?.name || step.fromActorName || startActor?.name}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cinema-black/60 border border-cinema-border/50 text-xs">
                  <Film className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span className="font-semibold text-gold truncate">
                    {step.movie?.title || step.movieTitle || 'Movie'}
                  </span>
                  {(step.movie?.year) && (
                    <span className="text-[10px] text-cinema-muted">({step.movie.year})</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <ArrowRight className="h-3.5 w-3.5 text-cinema-muted shrink-0 hidden sm:block" />
                  <div className="truncate font-semibold text-xs text-white text-right">
                    {step.nextActor?.name || step.toActorName || targetActor?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
