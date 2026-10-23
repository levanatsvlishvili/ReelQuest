import { useState, useEffect, useRef } from 'react';
import {
  createDuel,
  fetchDuel,
  joinDuel,
  submitDuelScore,
  fetchActorMovies,
  fetchMovieCast,
  getTmdbImageUrl
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Swords,
  Copy,
  Check,
  Share2,
  Trophy,
  Clock,
  ArrowRight,
  RotateCcw,
  RefreshCw,
  Users,
  Film,
  Sparkles,
  ChevronRight,
  Award
} from 'lucide-react';

export function DuelGameView({ onBackToMain, onOpenAuth }) {
  const { user, isAuthenticated } = useAuth();

  // URL duel ID detection
  const initialDuelId = new URLSearchParams(window.location.search).get('duel') || '';

  // Duel State
  const [duelIdInput, setDuelIdInput] = useState(initialDuelId);
  const [duel, setDuel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Creation / Join form state
  const [hostNickname, setHostNickname] = useState(user?.username || 'Cinephile');
  const [guestNickname, setGuestNickname] = useState(user?.username || 'Challenger');

  // Game execution state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentActor, setCurrentActor] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [chain, setChain] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [availableCast, setAvailableCast] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [castLoading, setCastLoading] = useState(false);
  const [playerFinished, setPlayerFinished] = useState(false);

  // Polling ref
  const pollTimerRef = useRef(null);

  // Determine current player ID
  const currentPlayerId = user?.id || (duel ? (duel.hostUserId?.includes(user?.id) ? duel.hostUserId : duel.guestUserId) : 'guest-player');
  const currentPlayerName = user?.username || (duel ? (currentPlayerId === duel.hostUserId ? duel.hostUsername : duel.guestUsername) : 'Player');

  // Load duel if initialDuelId provided
  useEffect(() => {
    if (initialDuelId) {
      loadDuelById(initialDuelId);
    }
  }, [initialDuelId]);

  // Polling effect when in lobby or waiting for opponent score
  useEffect(() => {
    if (!duel || duel.status === 'COMPLETED') return;

    const shouldPoll = (!isPlaying && duel.status === 'WAITING') || (playerFinished && duel.status !== 'COMPLETED');

    if (shouldPoll) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const updated = await fetchDuel(duel.duelId);
          if (updated) {
            setDuel(updated);
          }
        } catch (e) {
          console.warn('Duel polling error:', e);
        }
      }, 3000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [duel, isPlaying, playerFinished]);

  // Timer effect during gameplay
  useEffect(() => {
    let interval = null;
    if (isPlaying && !playerFinished) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playerFinished]);

  // Fetch movies when currentActor changes in game
  useEffect(() => {
    if (!isPlaying || !currentActor) return;
    let cancelled = false;
    setMoviesLoading(true);

    fetchActorMovies(currentActor.id)
      .then(movies => {
        if (!cancelled) {
          setAvailableMovies(movies || []);
          setMoviesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMoviesLoading(false);
      });

    return () => { cancelled = true; };
  }, [isPlaying, currentActor]);

  // Fetch cast when selectedMovie changes in game
  useEffect(() => {
    if (!isPlaying || !selectedMovie) {
      setAvailableCast([]);
      return;
    }
    let cancelled = false;
    setCastLoading(true);

    fetchMovieCast(selectedMovie.id)
      .then(cast => {
        if (!cancelled) {
          setAvailableCast(cast || []);
          setCastLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCastLoading(false);
      });

    return () => { cancelled = true; };
  }, [isPlaying, selectedMovie]);

  // Actions
  const loadDuelById = async (id) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDuel(id.trim());
      if (res) {
        setDuel(res);
        // Update URL query parameter without full reload
        const newUrl = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(res.duelId)}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      } else {
        setError('Duel lobby not found. Please check the code.');
      }
    } catch (e) {
      setError('Failed to fetch duel lobby.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDuel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createDuel({
        hostNickname: hostNickname.trim() || 'Host Cinephile'
      });
      if (res) {
        setDuel(res);
        const newUrl = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(res.duelId)}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    } catch (e) {
      setError('Failed to create duel lobby.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDuel = async () => {
    if (!duel) return;
    setLoading(true);
    setError(null);
    try {
      const res = await joinDuel(duel.duelId, {
        guestUserId: user?.id,
        guestUsername: guestNickname.trim() || 'Opponent'
      });
      if (res) {
        setDuel(res);
      }
    } catch (e) {
      setError('Failed to join duel.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!duel) return;
    const link = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(duel.duelId)}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareDuel = async () => {
    if (!duel) return;
    const link = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(duel.duelId)}`;
    const shareData = {
      title: 'ReelQuest 1v1 Movie Duel',
      text: `⚔️ I challenge you to a ReelQuest 1v1 Cinephile Duel! Connect ${duel.startActor.name} to ${duel.targetActor.name}. Fewest moves wins!`,
      url: link
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleStartGame = () => {
    if (!duel) return;
    setCurrentActor(duel.startActor);
    setChain([{ actor: duel.startActor, movie: null }]);
    setMoves(0);
    setTimerSeconds(0);
    setSelectedMovie(null);
    setPlayerFinished(false);
    setIsPlaying(true);
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const handleSelectActor = async (actor) => {
    if (!selectedMovie || !duel) return;

    const newChain = [...chain, { actor, movie: selectedMovie }];
    const newMoves = moves + 1;
    setChain(newChain);
    setCurrentActor(actor);
    setSelectedMovie(null);
    setMoves(newMoves);

    // Check if reached target
    if (actor.id === duel.targetActor.id) {
      setPlayerFinished(true);
      setIsPlaying(false);

      // Submit score
      try {
        const updated = await submitDuelScore(duel.duelId, {
          playerId: currentPlayerId,
          playerName: currentPlayerName,
          moves: newMoves,
          durationSeconds: timerSeconds
        });
        if (updated) {
          setDuel(updated);
        }
      } catch (e) {
        console.warn('Failed to submit duel score:', e);
      }
    }
  };

  const handleUndo = () => {
    if (selectedMovie) {
      setSelectedMovie(null);
      return;
    }
    if (chain.length > 1) {
      const newChain = chain.slice(0, -1);
      setChain(newChain);
      setCurrentActor(newChain[newChain.length - 1].actor);
      setMoves(m => Math.max(0, m - 1));
    }
  };

  const handleShareResults = async () => {
    if (!duel) return;
    const isHost = currentPlayerId === duel.hostUserId;
    const myScore = isHost ? `${duel.hostMoves} moves (${duel.hostDurationSeconds}s)` : `${duel.guestMoves} moves (${duel.guestDurationSeconds}s)`;
    const oppScore = isHost ? `${duel.guestMoves} moves (${duel.guestDurationSeconds}s)` : `${duel.hostMoves} moves (${duel.hostDurationSeconds}s)`;
    const oppName = isHost ? duel.guestUsername : duel.hostUsername;
    const myName = isHost ? duel.hostUsername : duel.guestUsername;

    let resultText = '🤝 Cinematic Tie!';
    if (duel.winnerId === currentPlayerId) resultText = '🏆 I Won!';
    else if (duel.winnerId === 'TIE') resultText = '🤝 Tied Match!';
    else if (duel.winnerId) resultText = '🎬 Valiant Effort!';

    const link = `${window.location.origin}${window.location.pathname}?duel=${encodeURIComponent(duel.duelId)}`;
    const text = `🎬 ReelQuest 1v1 Duel\n${resultText}\n⚔️ ${myName}: ${myScore}\n⚔️ ${oppName}: ${oppScore}\nCan you beat us? ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ReelQuest Duel Result', text, url: link });
      } catch {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Reset to lobby
  const handleResetToLobby = () => {
    setDuel(null);
    setIsPlaying(false);
    setPlayerFinished(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  };

  // ================= RENDER LOGIC =================

  // 1. GAMEPLAY SCREEN
  if (isPlaying) {
    return (
      <div className="space-y-6">
        {/* Duel Header Info */}
        <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-cinema-surface via-cinema-elevated to-cinema-surface p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gold">1v1 Duel Match</span>
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold text-gold">
                    Code: {duel.duelId}
                  </span>
                </div>
                <div className="text-sm font-semibold text-white">
                  {duel.hostUsername} <span className="text-gold">VS</span> {duel.guestUsername || 'Challenger'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-lg border border-cinema-border/60 bg-cinema-black/60 px-3 py-1.5 text-xs font-medium text-slate-300">
                <Clock className="h-3.5 w-3.5 text-gold" />
                <span className="font-mono text-sm font-bold text-white">
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-cinema-border/60 bg-cinema-black/60 px-3 py-1.5 text-xs font-medium text-slate-300">
                <span>Moves:</span>
                <span className="font-mono text-sm font-bold text-gold">{moves}</span>
              </div>
              <button
                onClick={handleUndo}
                disabled={chain.length <= 1 && !selectedMovie}
                className="flex items-center gap-1 rounded-lg border border-cinema-border/60 bg-cinema-surface px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>
            </div>
          </div>

          {/* Goal Stars Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-cinema-border/40 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-cinema-muted">Start:</span>
              <span className="text-xs font-bold text-white">{duel.startActor.name}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gold" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-cinema-muted">Target:</span>
              <span className="text-xs font-bold text-gold flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" />
                {duel.targetActor.name}
              </span>
            </div>
          </div>
        </div>

        {/* Current Path Chain */}
        <div className="rounded-xl border border-cinema-border/50 bg-cinema-surface/40 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-cinema-muted mb-2">
            Your Cinematic Path ({chain.length} hops):
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {chain.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                {idx > 0 && <span className="text-cinema-muted">→</span>}
                {step.movie && (
                  <span className="rounded bg-cinema-elevated px-2 py-0.5 text-[11px] text-slate-300 border border-cinema-border/40">
                    🎬 {step.movie.title}
                  </span>
                )}
                {idx > 0 && <span className="text-cinema-muted">→</span>}
                <span className={`font-semibold ${idx === chain.length - 1 ? 'text-gold' : 'text-slate-200'}`}>
                  {step.actor.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Game Selection Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Movies Column */}
          <div className="rounded-2xl border border-cinema-border/60 bg-cinema-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-bold text-white">
                  Step 1: Pick a movie with <span className="text-gold">{currentActor?.name}</span>
                </h3>
              </div>
              {moviesLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold" />}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {availableMovies.map((movie) => {
                const isSelected = selectedMovie?.id === movie.id;
                return (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition border ${
                      isSelected
                        ? 'border-gold bg-gold/15 text-white shadow-gold-glow/20'
                        : 'border-cinema-border/40 bg-cinema-elevated/40 text-slate-300 hover:border-cinema-muted hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{movie.title}</div>
                      <div className="text-[10px] text-cinema-muted">{movie.releaseYear || 'Cinema'}</div>
                    </div>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? 'text-gold' : 'text-cinema-muted'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cast Column */}
          <div className="rounded-2xl border border-cinema-border/60 bg-cinema-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-bold text-white">
                  Step 2: Pick a co-star {selectedMovie ? `from ${selectedMovie.title}` : ''}
                </h3>
              </div>
              {castLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold" />}
            </div>

            {!selectedMovie ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-cinema-muted text-xs">
                <Film className="h-8 w-8 mb-2 opacity-40 text-gold" />
                <span>Select a movie on the left first to reveal its co-stars!</span>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {availableCast
                  .filter(c => c.id !== currentActor?.id)
                  .map((castMember) => {
                    const isTarget = castMember.id === duel.targetActor.id;
                    return (
                      <button
                        key={castMember.id}
                        onClick={() => handleSelectActor(castMember)}
                        className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition border ${
                          isTarget
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200 animate-pulse'
                            : 'border-cinema-border/40 bg-cinema-elevated/40 text-slate-300 hover:border-gold hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {castMember.profilePath ? (
                            <img
                              src={getTmdbImageUrl(castMember.profilePath)}
                              alt={castMember.name}
                              className="h-8 w-8 rounded-full object-cover border border-cinema-border/60"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-cinema-surface flex items-center justify-center text-xs font-bold text-cinema-muted">
                              {castMember.name.slice(0, 1)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-bold flex items-center gap-1.5">
                              {castMember.name}
                              {isTarget && (
                                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                                  TARGET GOAL!
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-cinema-muted">{castMember.character || 'Actor'}</div>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 ${isTarget ? 'text-emerald-400' : 'text-cinema-muted'}`} />
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. FINISHED / RESULTS SCREEN (or Waiting for Opponent to Submit)
  if (playerFinished || (duel && duel.status === 'COMPLETED')) {
    const isHost = currentPlayerId === duel.hostUserId;
    const isCompleted = duel.status === 'COMPLETED';
    const isWinner = isCompleted && duel.winnerId === currentPlayerId;
    const isTie = isCompleted && duel.winnerId === 'TIE';

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-cinema-surface via-cinema-elevated to-cinema-surface p-6 sm:p-8 text-center shadow-2xl">
          {/* Otara Mascot Header */}
          <div className="flex justify-center mb-4">
            <img
              src={isWinner ? '/assets/otara/otara-impressed.png' : '/assets/otara/otara-encouraging.png'}
              alt="Otara Oracle"
              className="h-28 w-28 object-contain drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/assets/otara/otara-avatar.png';
              }}
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold mb-2">
            <Trophy className="h-3.5 w-3.5" />
            <span>1v1 Duel Showdown</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isCompleted ? (
              isWinner ? '👑 VICTORY! You Won the Duel!' : isTie ? '🤝 Epic Cinematic Tie!' : '🎬 Defeat! Close Match!'
            ) : (
              '⏳ Run Complete! Waiting for Opponent...'
            )}
          </h2>

          <p className="mt-2 text-sm text-cinema-muted max-w-lg mx-auto">
            {isCompleted
              ? 'Both players have submitted their runs. Here is the head-to-head breakdown:'
              : `You finished your cinematic path in ${moves} moves and ${timerSeconds}s. Standing by for ${isHost ? duel.guestUsername || 'Opponent' : duel.hostUsername} to finish.`}
          </p>

          {/* Head-to-Head Comparison Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Host Card */}
            <div className={`rounded-2xl border p-5 transition ${
              duel.winnerId === duel.hostUserId
                ? 'border-gold bg-gold/15 shadow-gold-glow/20'
                : 'border-cinema-border/60 bg-cinema-surface/60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cinema-muted">Host</span>
                {duel.winnerId === duel.hostUserId && (
                  <span className="flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-black">
                    <Trophy className="h-3 w-3" /> WINNER
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-white">{duel.hostUsername}</div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <div className="text-[10px] text-cinema-muted uppercase">Moves</div>
                  <div className="text-xl font-black text-gold">{duel.hostMoves != null ? duel.hostMoves : 'In Game...'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-cinema-muted uppercase">Duration</div>
                  <div className="text-xl font-black text-white">
                    {duel.hostDurationSeconds != null ? `${duel.hostDurationSeconds}s` : '...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Card */}
            <div className={`rounded-2xl border p-5 transition ${
              duel.winnerId === duel.guestUserId
                ? 'border-gold bg-gold/15 shadow-gold-glow/20'
                : 'border-cinema-border/60 bg-cinema-surface/60'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cinema-muted">Opponent</span>
                {duel.winnerId === duel.guestUserId && (
                  <span className="flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-black text-black">
                    <Trophy className="h-3 w-3" /> WINNER
                  </span>
                )}
              </div>
              <div className="text-lg font-extrabold text-white">{duel.guestUsername || 'Waiting...'}</div>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div>
                  <div className="text-[10px] text-cinema-muted uppercase">Moves</div>
                  <div className="text-xl font-black text-gold">{duel.guestMoves != null ? duel.guestMoves : 'In Game...'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-cinema-muted uppercase">Duration</div>
                  <div className="text-xl font-black text-white">
                    {duel.guestDurationSeconds != null ? `${duel.guestDurationSeconds}s` : '...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isCompleted && (
              <button
                onClick={handleShareResults}
                className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-black hover:bg-gold-light transition shadow-gold-glow/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copied ? 'Copied Results!' : 'Share Duel Results'}</span>
              </button>
            )}
            <button
              onClick={handleResetToLobby}
              className="flex items-center gap-2 rounded-xl border border-cinema-border/60 bg-cinema-surface px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New 1v1 Duel</span>
            </button>
            <button
              onClick={onBackToMain}
              className="flex items-center gap-2 rounded-xl border border-cinema-border/60 bg-cinema-surface px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
            >
              <span>Back to Daily</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. LOBBY WAITING ROOM (Duel is active / loaded)
  if (duel) {
    const isGuest = duel.guestUserId === currentPlayerId || (!duel.hostUserId?.includes(user?.id) && duel.status === 'WAITING');
    const isHost = duel.hostUserId === currentPlayerId || duel.hostUserId?.includes(user?.id);
    const canJoin = duel.status === 'WAITING' && !isHost;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-3xl border border-gold/40 bg-cinema-surface p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cinema-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/30">
                <Swords className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">1v1 Duel Lobby</h2>
                <p className="text-xs text-cinema-muted">Match Code: <span className="font-mono text-gold font-bold">{duel.duelId}</span></p>
              </div>
            </div>

            <button
              onClick={handleResetToLobby}
              className="text-xs text-cinema-muted hover:text-white transition"
            >
              Leave Lobby
            </button>
          </div>

          {/* Goal Stars Display */}
          <div className="rounded-2xl border border-cinema-border/60 bg-cinema-elevated/40 p-4">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-cinema-muted mb-3 text-center">
              Target Challenge Stars
            </div>
            <div className="flex items-center justify-around gap-4">
              <div className="text-center">
                {duel.startActor.profilePath ? (
                  <img
                    src={getTmdbImageUrl(duel.startActor.profilePath)}
                    alt={duel.startActor.name}
                    className="h-16 w-16 mx-auto rounded-full object-cover border-2 border-gold/40 mb-2 shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 mx-auto rounded-full bg-cinema-surface flex items-center justify-center text-lg font-bold text-gold border border-cinema-border mb-2">
                    {duel.startActor.name.slice(0, 1)}
                  </div>
                )}
                <div className="text-xs font-bold text-white">{duel.startActor.name}</div>
                <div className="text-[10px] text-cinema-muted">Start Star</div>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight className="h-6 w-6 text-gold mb-1" />
                <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                  {duel.optimalHops} hops optimal
                </span>
              </div>

              <div className="text-center">
                {duel.targetActor.profilePath ? (
                  <img
                    src={getTmdbImageUrl(duel.targetActor.profilePath)}
                    alt={duel.targetActor.name}
                    className="h-16 w-16 mx-auto rounded-full object-cover border-2 border-gold/40 mb-2 shadow-lg"
                  />
                ) : (
                  <div className="h-16 w-16 mx-auto rounded-full bg-cinema-surface flex items-center justify-center text-lg font-bold text-gold border border-cinema-border mb-2">
                    {duel.targetActor.name.slice(0, 1)}
                  </div>
                )}
                <div className="text-xs font-bold text-white">{duel.targetActor.name}</div>
                <div className="text-[10px] text-cinema-muted">Goal Star</div>
              </div>
            </div>
          </div>

          {/* Players Roster */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-cinema-border/50 bg-cinema-surface/60 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-cinema-muted">Host (Player 1)</div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                  <span>👑 {duel.hostUsername}</span>
                  {isHost && <span className="text-[10px] text-gold">(You)</span>}
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Ready
              </span>
            </div>

            <div className="rounded-xl border border-cinema-border/50 bg-cinema-surface/60 p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase text-cinema-muted">Challenger (Player 2)</div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                  <span>⚔️ {duel.guestUsername || 'Waiting...'}</span>
                  {duel.guestUserId === currentPlayerId && <span className="text-[10px] text-gold">(You)</span>}
                </div>
              </div>
              {duel.guestUsername ? (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 animate-pulse">
                  Waiting
                </span>
              )}
            </div>
          </div>

          {/* Share Link Banner for Host */}
          {duel.status === 'WAITING' && (
            <div className="rounded-2xl border border-dashed border-gold/40 bg-gold/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gold flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" />
                  Invite Your Opponent:
                </span>
                <span className="text-[10px] text-cinema-muted">Live sync enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?duel=${duel.duelId}`}
                  className="flex-1 rounded-xl border border-cinema-border/60 bg-cinema-black/80 px-3 py-2 text-xs font-mono text-slate-300 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 rounded-xl bg-gold px-3 py-2 text-xs font-bold text-black hover:bg-gold-light transition shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleShareDuel}
                  className="flex items-center gap-1.5 rounded-xl border border-cinema-border/60 bg-cinema-surface px-3 py-2 text-xs font-bold text-white hover:border-gold transition shrink-0"
                >
                  <Share2 className="h-4 w-4 text-gold" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>
          )}

          {/* Join Form for Guests who arrived via link */}
          {canJoin && (
            <div className="rounded-2xl border border-gold/30 bg-cinema-elevated/40 p-4 space-y-3">
              <div className="text-xs font-bold text-white">Join this Duel:</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestNickname}
                  onChange={(e) => setGuestNickname(e.target.value)}
                  placeholder="Your Cinephile Nickname"
                  className="flex-1 rounded-xl border border-cinema-border/60 bg-cinema-black/80 px-3 py-2 text-xs text-white placeholder-cinema-muted focus:border-gold outline-none"
                />
                <button
                  onClick={handleJoinDuel}
                  disabled={loading}
                  className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-black hover:bg-gold-light transition shadow-gold-glow/20 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Lobby'}
                </button>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={handleStartGame}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-sm font-black text-black hover:bg-gold-light transition shadow-gold-glow/30"
            >
              <Swords className="h-4 w-4" />
              <span>Start Match Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. LOBBY SETUP / CREATION FORM (Default Initial View)
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-3xl border border-cinema-border/60 bg-cinema-surface p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-gold border border-gold/30 shadow-gold-glow/20">
            <Swords className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">1v1 Online Cinema Duel</h2>
          <p className="text-xs text-cinema-muted max-w-md mx-auto">
            Challenge your friends head-to-head. Both players receive the exact same start and target star.
            Fewest moves wins; speed breaks ties!
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Create Lobby Card */}
          <div className="rounded-2xl border border-cinema-border/60 bg-cinema-elevated/40 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="h-4 w-4 text-gold" />
                <span>Create a New Duel</span>
              </div>
              <p className="text-xs text-cinema-muted">
                Create a private lobby and generate a shareable link for a friend or rival.
              </p>
              <div>
                <label className="text-[10px] font-bold uppercase text-cinema-muted block mb-1">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={hostNickname}
                  onChange={(e) => setHostNickname(e.target.value)}
                  placeholder="Cinephile Master"
                  className="w-full rounded-xl border border-cinema-border/60 bg-cinema-black/80 px-3 py-2 text-xs text-white placeholder-cinema-muted focus:border-gold outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleCreateDuel}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-black hover:bg-gold-light transition shadow-gold-glow/20 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Swords className="h-3.5 w-3.5" />}
              <span>{loading ? 'Creating...' : 'Create Duel Lobby'}</span>
            </button>
          </div>

          {/* Join Lobby Card */}
          <div className="rounded-2xl border border-cinema-border/60 bg-cinema-elevated/40 p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Users className="h-4 w-4 text-gold" />
                <span>Join by Code</span>
              </div>
              <p className="text-xs text-cinema-muted">
                Received a code from a friend? Enter the lobby ID below to enter the arena.
              </p>
              <div>
                <label className="text-[10px] font-bold uppercase text-cinema-muted block mb-1">
                  Duel Code
                </label>
                <input
                  type="text"
                  value={duelIdInput}
                  onChange={(e) => setDuelIdInput(e.target.value)}
                  placeholder="e.g. 7f8a2b3c"
                  className="w-full rounded-xl border border-cinema-border/60 bg-cinema-black/80 px-3 py-2 text-xs text-white font-mono placeholder-cinema-muted focus:border-gold outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => loadDuelById(duelIdInput)}
              disabled={loading || !duelIdInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-cinema-border/60 bg-cinema-surface py-2.5 text-xs font-bold text-white hover:border-gold transition disabled:opacity-50"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-gold" /> : <ArrowRight className="h-3.5 w-3.5 text-gold" />}
              <span>{loading ? 'Finding...' : 'Join Lobby'}</span>
            </button>
          </div>
        </div>

        {/* Back button */}
        <div className="text-center pt-2">
          <button
            onClick={onBackToMain}
            className="text-xs text-cinema-muted hover:text-white transition"
          >
            ← Back to Solo Mode
          </button>
        </div>
      </div>
    </div>
  );
}
