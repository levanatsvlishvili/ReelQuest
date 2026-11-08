import { useState, useEffect, useRef } from 'react';
import { Clock, Footprints, RotateCcw, Flag, User, Lightbulb, Sparkles, Trophy } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';
import OtaraObservingMascot from './OtaraObservingMascot';
import { playHintWhisper } from '../utils/soundEffects';

export function ChallengeHeader({
  challenge,
  moves,
  timerSeconds,
  onUndo,
  onGiveUp,
  canUndo,
  gameStatus,
  onViewSummary,
  onOpenHint
}) {
  const [activeEmotion, setActiveEmotion] = useState('OBSERVING');
  const prevMovesRef = useRef(moves);
  const emotionTimerRef = useRef(null);

  const optimalHops = challenge?.optimalHops || 2;
  const isPlaying = gameStatus === 'PLAYING';

  useEffect(() => {
    if (!isPlaying) {
      prevMovesRef.current = moves;
      return;
    }

    if (moves > prevMovesRef.current) {
      if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
      if (moves <= optimalHops) {
        setActiveEmotion('IMPRESSED');
      } else {
        setActiveEmotion('ENCOURAGING');
      }
      emotionTimerRef.current = setTimeout(() => {
        setActiveEmotion('OBSERVING');
      }, 3200);
    }

    prevMovesRef.current = moves;

    return () => {
      if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    };
  }, [moves, optimalHops, isPlaying]);

  if (!challenge) return null;

  const { startActor, targetActor } = challenge;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleHintClick = () => {
    playHintWhisper();
    setActiveEmotion('HINT');
    if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    emotionTimerRef.current = setTimeout(() => {
      setActiveEmotion('OBSERVING');
    }, 4000);
    if (onOpenHint) onOpenHint();
  };

  const getCommentaryText = () => {
    if (activeEmotion === 'IMPRESSED') {
      return `„Spot on! Right on the golden par pace! One step closer to cinema glory.“`;
    }
    if (activeEmotion === 'ENCOURAGING') {
      return `„A scenic detour, but the connection is still alive. Look for a bridge co-star!“`;
    }
    if (activeEmotion === 'HINT') {
      return `„Otara's Oracle Whisper: Look for celebrated films where both stars shared the marquee!“`;
    }
    if (moves === 0) {
      return `„I already found the route in ${optimalHops} hops. Select your opening film below...“`;
    }
    if (moves < optimalHops) {
      return `„Looking sharp! You're at ${moves} hops, right on pace with my Par.“`;
    }
    if (moves === optimalHops) {
      return `„Tense moment! One direct link right now will tie my record!“`;
    }
    return `„Keep pushing forward — every co-star brings you closer to the target!“`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cinema-border/90 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-3.5 sm:p-4 shadow-card-glow">
      <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

      <div className="grid grid-cols-2 md:grid-cols-12 items-center gap-3 md:gap-4 relative z-10">
        <div className="col-span-1 md:col-span-3 order-1 flex items-center gap-3 min-w-0">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-500/50 bg-cinema-surface shadow-md">
            {startActor.profilePath ? (
              <img
                src={getTmdbImageUrl(startActor.profilePath)}
                alt={startActor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cinema-border/50 text-cinema-muted">
                <User className="h-7 w-7" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Origin
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
              {startActor.name}
            </h2>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">Starting star</p>
          </div>
        </div>

        <div className="col-span-2 md:col-span-6 order-3 md:order-2 flex flex-col justify-center gap-2.5 border-t md:border-t-0 md:border-x border-cinema-border/60 pt-3 md:pt-0 md:px-4">
          {isPlaying && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0 flex items-center justify-center">
                <OtaraObservingMascot
                  moves={moves}
                  optimalHops={optimalHops}
                  size="sm"
                  emotion={activeEmotion}
                  showBadge={false}
                />
                {activeEmotion === 'OBSERVING' && (
                  <div className="absolute bottom-1 right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-cinema-black" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black flex items-center gap-1 text-white">
                    <Sparkles className="h-3.5 w-3.5 text-gold fill-gold" />
                    {activeEmotion === 'IMPRESSED' ? (
                      <span className="text-gold">Otara is Impressed!</span>
                    ) : activeEmotion === 'ENCOURAGING' ? (
                      <span className="text-indigo-300">Otara is Cheering!</span>
                    ) : activeEmotion === 'HINT' ? (
                      <span className="text-amber-400">Oracle Hint Active</span>
                    ) : (
                      'Otara is Watching'
                    )}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold border leading-none ${
                      activeEmotion === 'IMPRESSED'
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : activeEmotion === 'ENCOURAGING'
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                    }`}
                  >
                    {activeEmotion === 'OBSERVING' ? 'LIVE' : activeEmotion}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-snug line-clamp-2">
                  {getCommentaryText()}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-black/75 px-2.5 py-1 text-xs">
                <Footprints className="h-3.5 w-3.5 text-gold" />
                <span className="text-slate-400">Hops:</span>
                <strong className="text-white font-black">{moves}</strong>
                <span className="text-slate-500">/</span>
                <span className="text-amber-400 font-bold">Par {optimalHops}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-black/75 px-2.5 py-1 text-xs font-mono font-bold text-slate-100">
                <Clock className="h-3.5 w-3.5 text-gold" />
                <span>{formattedTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-1 rounded-xl border border-cinema-border bg-cinema-surface px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title="Step back one step or change film"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              {isPlaying && onOpenHint && (
                <button
                  type="button"
                  onClick={handleHintClick}
                  className="flex items-center gap-1 rounded-xl border border-gold/60 bg-gold/15 px-3 py-1.5 text-xs font-extrabold text-gold hover:bg-gold hover:text-cinema-black shadow-gold-glow transition active:scale-95"
                  title="Ask Otara for a Cinephile Hint"
                >
                  <Lightbulb className="h-3.5 w-3.5 fill-current" />
                  <span>Hint</span>
                </button>
              )}

              {isPlaying && (
                <button
                  type="button"
                  onClick={onGiveUp}
                  className="flex items-center gap-1 rounded-xl border border-rose-500/35 bg-rose-500/10 px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
                  title="Give up and reveal shortest path"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Give Up</span>
                </button>
              )}

              {!isPlaying && onViewSummary && (
                <button
                  type="button"
                  onClick={onViewSummary}
                  className="flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-cinema-black shadow-sm"
                  title="View Result Summary"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Results</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 order-2 md:order-3 flex items-center justify-end gap-3 text-right min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold block">
              Target Goal
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
              {targetActor.name}
            </h2>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">Goal destination</p>
          </div>
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl border-2 border-gold bg-cinema-surface shadow-gold-glow">
            {targetActor.profilePath ? (
              <img
                src={getTmdbImageUrl(targetActor.profilePath)}
                alt={targetActor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cinema-border/50 text-cinema-muted">
                <User className="h-7 w-7" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
