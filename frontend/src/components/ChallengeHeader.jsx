import { useState, useEffect, useRef } from 'react';
import { Clock, RotateCcw, Flag, User, Lightbulb, Trophy, ArrowRight, Film } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';
import OtaraObservingMascot from './OtaraObservingMascot';
import { playHintWhisper } from '../utils/soundEffects';

export function ChallengeHeader({
  challenge,
  chain = [],
  moves,
  timerSeconds,
  onUndo,
  onStepClick,
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
      return 'Spot on! Right on the golden par pace.';
    }
    if (activeEmotion === 'ENCOURAGING') {
      return 'Scenic detour, still alive — look for a bridge co-star.';
    }
    if (activeEmotion === 'HINT') {
      return 'Oracle Whisper active — check shared marquee films.';
    }
    if (moves === 0) {
      return `I solved this in ${optimalHops} hops. Pick your opening film below.`;
    }
    if (moves < optimalHops) {
      return `At ${moves} hop${moves === 1 ? '' : 's'} — right on pace to match my Par.`;
    }
    if (moves === optimalHops) {
      return 'One direct link right now will tie my record!';
    }
    return 'Keep going — every co-star brings you closer to the target.';
  };

  const intermediateSteps = chain.slice(1);
  const targetReached = targetActor && chain[chain.length - 1]?.actor?.id === targetActor.id;

  return (
    <div className="space-y-2.5">
      <div className="rounded-2xl border border-white/[0.08] bg-cinema-surface px-4 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (chain.length > 1 && onStepClick) onStepClick(0);
            }}
            className={`flex items-center gap-3 min-w-0 text-left shrink-0 ${
              chain.length > 1 ? 'cursor-pointer group' : 'cursor-default'
            }`}
            title={chain.length > 1 ? `Click to step back to ${startActor.name}` : undefined}
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-emerald-500/50 bg-cinema-card">
              {startActor.profilePath ? (
                <img
                  src={getTmdbImageUrl(startActor.profilePath)}
                  alt={startActor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90 block">
                Start
              </span>
              <h2 className="text-sm font-extrabold text-white truncate group-hover:text-gold transition">
                {startActor.name}
              </h2>
            </div>
          </button>

          <div className="flex items-center lg:justify-center gap-2 overflow-x-auto scrollbar-none py-1 flex-1 min-w-0">
            {intermediateSteps.length === 0 ? (
              <div className="flex items-center gap-2 text-xs">
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="rounded-lg border border-dashed border-gold/40 bg-gold/[0.06] px-3 py-1.5 text-xs font-semibold text-gold whitespace-nowrap">
                  Pick a film below
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              </div>
            ) : (
              intermediateSteps.map((node, idx) => {
                const chainIndex = idx + 1;
                const isLast = chainIndex === chain.length - 1;
                const isClickable = !isLast && Boolean(onStepClick);
                const isTargetStep = targetActor && node.actor?.id === targetActor.id;

                return (
                  <div key={`${node.actor?.id || idx}-${chainIndex}`} className="flex items-center gap-2 shrink-0">
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    {node.movie && (
                      <>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-cinema-card px-2.5 py-1 text-xs text-slate-200 max-w-[165px]">
                          <Film className="h-3 w-3 text-gold shrink-0" />
                          <span className="truncate font-medium">{node.movie.title}</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                      </>
                    )}
                    {!isTargetStep && (
                      <button
                        type="button"
                        onClick={() => isClickable && onStepClick(chainIndex)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          isClickable
                            ? 'border-white/[0.1] bg-cinema-card text-white hover:border-gold/50 hover:text-gold cursor-pointer'
                            : 'border-gold/40 bg-gold/10 text-gold cursor-default'
                        }`}
                        title={isClickable ? `Click to step back to ${node.actor?.name}` : undefined}
                      >
                        <span className="max-w-[130px] truncate">{node.actor?.name}</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {intermediateSteps.length > 0 && !targetReached && (
              <div className="flex items-center gap-2 shrink-0">
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="rounded-lg border border-dashed border-gold/35 bg-gold/[0.05] px-2.5 py-1 text-[11px] font-semibold text-gold/90 whitespace-nowrap">
                  Next film…
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-600 shrink-0" />
              </div>
            )}
          </div>

          <div className="flex items-center lg:justify-end gap-3 lg:text-right min-w-0 shrink-0">
            <div className="min-w-0 order-2 lg:order-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                Target
              </span>
              <h2 className="text-sm font-extrabold text-white truncate">
                {targetActor.name}
              </h2>
            </div>
            <div className="h-11 w-11 shrink-0 order-1 lg:order-2 overflow-hidden rounded-full border-2 border-gold bg-cinema-card">
              {targetActor.profilePath ? (
                <img
                  src={getTmdbImageUrl(targetActor.profilePath)}
                  alt={targetActor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-cinema-surface/70 px-3.5 py-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isPlaying && (
            <>
              <div className="shrink-0">
                <OtaraObservingMascot
                  moves={moves}
                  optimalHops={optimalHops}
                  size="sm"
                  emotion={activeEmotion}
                  showBadge={false}
                />
              </div>
              <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                <strong className="text-gold font-bold mr-1">Otara:</strong>
                {getCommentaryText()}
              </p>
            </>
          )}
          {!isPlaying && (
            <span className="text-xs font-semibold text-cinema-muted">
              Challenge completed — review your trail or inspect the optimal route.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="inline-flex items-center gap-1 rounded-lg bg-cinema-card px-2.5 py-1.5 text-xs font-bold text-white tabular-nums">
            <span>{moves}</span>
            <span className="text-slate-500 font-normal">/ Par {optimalHops}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-lg bg-cinema-card px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-200">
            <Clock className="h-3.5 w-3.5 text-gold" />
            <span>{formattedTime}</span>
          </div>

          {isPlaying && (
            <>
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                className="flex items-center gap-1 rounded-lg border border-white/[0.1] px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                title="Undo last step"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Undo</span>
              </button>

              {onOpenHint && (
                <button
                  type="button"
                  onClick={handleHintClick}
                  className="flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-cinema-black active:scale-95"
                  title="Ask Otara for a Hint"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>Hint</span>
                </button>
              )}

              <button
                type="button"
                onClick={onGiveUp}
                className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition hover:border-rose-500/40 hover:bg-rose-500/10"
                title="Give up and reveal shortest path"
              >
                <Flag className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Give Up</span>
              </button>
            </>
          )}

          {!isPlaying && onViewSummary && (
            <button
              type="button"
              onClick={onViewSummary}
              className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Results</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
