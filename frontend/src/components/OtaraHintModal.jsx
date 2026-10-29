import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  X,
  Sparkles,
  ArrowRight,
  Film,
  User,
  Crown,
  Play,
  CheckCircle2,
  Lock,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchOtaraHint, getTmdbImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { playClick, playHintWhisper, playNodeConnect } from '../utils/soundEffects';

export function OtaraHintModal({
  isOpen,
  onClose,
  currentActor,
  targetActor,
  onSelectHintMovie,
  onOpenPro
}) {
  const { user } = useAuth();
  const isPro = !!user?.isPro;

  const [loading, setLoading] = useState(false);
  const [hintData, setHintData] = useState(null);
  const [error, setError] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  // Track if free hint was already used in this browser session
  const [sessionFreeHintsUsed, setSessionFreeHintsUsed] = useState(() => {
    return parseInt(sessionStorage.getItem('reelquest_free_hints_used') || '0', 10);
  });

  const hasExhaustedFreeHints = !isPro && sessionFreeHintsUsed >= 1;

  useEffect(() => {
    if (!isOpen || !currentActor?.id || !targetActor?.id) return;

    setIsRevealed(false);
    setError('');

    if (hasExhaustedFreeHints) {
      return;
    }

    setLoading(true);
    fetchOtaraHint(currentActor.id, targetActor.id)
      .then((data) => {
        if (data) {
          setHintData(data);
          if (!isPro) {
            const nextCount = sessionFreeHintsUsed + 1;
            setSessionFreeHintsUsed(nextCount);
            sessionStorage.setItem('reelquest_free_hints_used', String(nextCount));
          }
        } else {
          setError('Otara could not find an immediate shortcut. Try stepping back to a previous co-star!');
        }
      })
      .catch(() => {
        setError('Failed to reach Otara Oracle. Please check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentActor?.id, targetActor?.id, isPro, hasExhaustedFreeHints, sessionFreeHintsUsed]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cinema-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-card shadow-2xl p-6 sm:p-7 space-y-5">
        {/* Subtle gold glow accent */}
        <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gold/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-cinema-border/70 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src="/assets/otara/otara-challenge.png"
                alt="Otara"
                className="h-13 w-13 rounded-2xl object-contain bg-gold/15 border-2 border-gold/50 p-1 shadow-gold-glow"
                onError={(e) => {
                  e.currentTarget.src = '/assets/otara/otara-impressed.png';
                }}
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-cinema-black shadow-sm">
                <Lightbulb className="h-3 w-3 fill-cinema-black" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-gold">
                  <Sparkles className="h-3 w-3" />
                  Otara&apos;s Cinema Hint
                </span>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[9px] font-black text-indigo-300 uppercase">
                    <Crown className="h-2.5 w-2.5" /> Unlimited Pro
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300">
                    {hasExhaustedFreeHints ? '0 free hints left' : '1 free daily hint'}
                  </span>
                )}
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-black text-white">
                Oracle Whisper &amp; Bridge Clue
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-cinema-border bg-cinema-surface/80 p-2 text-cinema-muted hover:text-white hover:border-gold/40 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current State Navigation Bar */}
        <div className="flex items-center justify-between rounded-xl border border-cinema-border/60 bg-cinema-black/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-cinema-muted">At:</span>
            <span className="font-extrabold text-emerald-400 truncate">{currentActor?.name}</span>
          </div>
          <ArrowRight className="h-3.5 w-3.5 text-gold shrink-0 mx-2" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-cinema-muted">Goal:</span>
            <span className="font-extrabold text-gold truncate">{targetActor?.name}</span>
          </div>
        </div>

        {/* Content Body */}
        {hasExhaustedFreeHints ? (
          /* Free Quota Exhausted Card */
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-b from-gold/10 to-transparent p-5 text-center space-y-4 animate-fade-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
              <Crown className="h-6 w-6 fill-gold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Daily Free Hint Used!
              </h3>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                You have used your 1 free hint for this session. Upgrade to <strong className="text-gold">ReelQuest Pro</strong> for unlimited Otara hints, custom Hollywood path finder, and ad-free play!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenPro();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-2.5 text-xs font-black text-cinema-black shadow-gold-glow hover:opacity-90 transition active:scale-95"
              >
                <Crown className="h-4 w-4 fill-cinema-black" />
                <span>Upgrade to Pro ($4.99/mo)</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Continue Guessing Solo
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-xs font-semibold text-cinema-muted">
              Consulting the Hollywood cinema oracle...
            </p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : hintData ? (
          <div className="space-y-4">
            {/* Stage 1: The Cryptic Riddle (Spoiler-Free Clue) */}
            <div className="relative rounded-2xl border border-gold/50 bg-gradient-to-r from-gold/10 via-cinema-surface to-gold/5 p-4 sm:p-5 shadow-card">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold block mb-1">
                💬 Otara&apos;s Riddle Clue:
              </span>
              <p className="text-xs sm:text-sm font-medium italic text-slate-100 leading-relaxed">
                &ldquo;{hintData.riddleClue}&rdquo;
              </p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-cinema-muted">
                <span>Remaining optimal hops: <strong className="text-gold">{hintData.remainingHops}</strong></span>
                <span className="italic">Can you deduce it before revealing?</span>
              </div>
            </div>

            {/* Stage 2: Direct Solution Reveal */}
            {!isRevealed ? (
              <button
                onClick={() => {
                  playHintWhisper();
                  setIsRevealed(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-cinema-card hover:bg-gold/15 hover:border-gold px-4 py-3 text-xs font-extrabold text-gold transition active:scale-98 shadow-sm"
              >
                <Eye className="h-4 w-4" />
                <span>Reveal Exact Bridge Movie &amp; Co-Star</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Recommended Optimal Next Hop
                  </span>
                  <span className="text-[10px] text-cinema-muted">
                    Shortest BFS Path
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Recommended Movie */}
                  <div className="flex items-center gap-3 rounded-xl border border-cinema-border/70 bg-cinema-black/60 p-3">
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-lg border border-gold/30 bg-cinema-surface">
                      {hintData.recommendedMoviePoster ? (
                        <img
                          src={getTmdbImageUrl(hintData.recommendedMoviePoster)}
                          alt={hintData.recommendedMovieTitle}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gold">
                          <Film className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cinema-muted block">
                        Bridge Movie
                      </span>
                      <h4 className="text-xs font-extrabold text-white truncate">
                        {hintData.recommendedMovieTitle}
                      </h4>
                      {hintData.recommendedMovieYear > 0 && (
                        <span className="text-[10px] text-gold font-mono">
                          {hintData.recommendedMovieYear}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Next Target Co-Star */}
                  <div className="flex items-center gap-3 rounded-xl border border-cinema-border/70 bg-cinema-black/60 p-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-emerald-500/40 bg-cinema-surface">
                      {hintData.nextActorImage ? (
                        <img
                          src={getTmdbImageUrl(hintData.nextActorImage)}
                          alt={hintData.nextActorName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-emerald-400">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cinema-muted block">
                        Target Co-Star
                      </span>
                      <h4 className="text-xs font-extrabold text-emerald-300 truncate">
                        {hintData.nextActorName}
                      </h4>
                      <span className="text-[10px] text-cinema-muted">
                        Connects onward
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action to Auto-Select in Game */}
                {onSelectHintMovie && (
                  <button
                    onClick={() => {
                      onSelectHintMovie({
                        id: hintData.recommendedMovieId,
                        title: hintData.recommendedMovieTitle,
                        posterPath: hintData.recommendedMoviePoster,
                        year: hintData.recommendedMovieYear
                      });
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 py-2.5 text-xs font-black text-cinema-black shadow-gold-glow hover:opacity-95 transition active:scale-95"
                  >
                    <Play className="h-3.5 w-3.5 fill-cinema-black" />
                    <span>Select &ldquo;{hintData.recommendedMovieTitle}&rdquo; in Game</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Footer info & close */}
        <div className="flex items-center justify-between border-t border-cinema-border/50 pt-3 text-[11px] text-cinema-muted">
          <span>Using hints still counts toward your total hops.</span>
          <button
            onClick={onClose}
            className="font-bold text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
