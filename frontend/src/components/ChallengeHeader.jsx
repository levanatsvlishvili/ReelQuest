import { Clock, Footprints, RotateCcw, Flag, User, Lightbulb } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';

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
  if (!challenge) return null;

  const { startActor, targetActor, date } = challenge;
  const optimalHops = challenge.optimalHops || 2;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card to-cinema-surface p-4 shadow-card-glow sm:p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        
        {/* Start Actor */}
        <div className="flex items-center gap-4">
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-500/50 bg-cinema-surface shadow-md sm:h-20 sm:w-20">
            {startActor.profilePath ? (
              <img
                src={getTmdbImageUrl(startActor.profilePath)}
                alt={startActor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cinema-border/50 text-cinema-muted">
                <User className="h-8 w-8" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 rounded bg-emerald-950/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/40">
              Start
            </span>
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Origin Actor
            </span>
            <h2 className="text-lg font-bold text-white sm:text-xl">{startActor.name}</h2>
            <p className="text-xs text-cinema-muted">Connect from here</p>
          </div>
        </div>

        {/* Center HUD & Stats */}
        <div className="flex flex-col items-center justify-center border-y border-cinema-border/50 py-3 md:border-y-0 md:py-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-cinema-border/70 px-2.5 py-0.5 text-[11px] font-medium text-cinema-muted">
              Daily #{date}
            </span>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Beat Otara
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-slate-200">
              <Footprints className="h-4 w-4 text-gold" />
              <div className="text-center">
                <span className="text-xs text-cinema-muted block">Hops</span>
                <span className="text-base font-bold sm:text-lg">{moves}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-cinema-border" />

            <div className="flex items-center gap-2 text-amber-300">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Otara's Par</span>
                <span className="text-base font-bold sm:text-lg text-amber-400">{optimalHops}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-cinema-border" />

            <div className="flex items-center gap-2 text-slate-200">
              <Clock className="h-4 w-4 text-gold" />
              <div className="text-center">
                <span className="text-xs text-cinema-muted block">Time</span>
                <span className="text-base font-bold font-mono sm:text-lg">{formattedTime}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-gold/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              title="Step back to previous step or filmography"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Step Back</span>
            </button>

            {gameStatus === 'PLAYING' && onOpenHint && (
              <button
                onClick={onOpenHint}
                className="flex items-center gap-1.5 rounded-lg border border-gold/60 bg-gold/15 px-3 py-1 text-xs font-extrabold text-gold hover:bg-gold hover:text-cinema-black shadow-gold-glow transition active:scale-95"
                title="Ask Otara for a Cinephile Hint"
              >
                <Lightbulb className="h-3.5 w-3.5 fill-gold hover:fill-current" />
                <span>Otara&apos;s Hint</span>
              </button>
            )}

            {gameStatus === 'PLAYING' && (
              <button
                onClick={onGiveUp}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                title="Give up and reveal shortest path"
              >
                <Flag className="h-3 w-3" />
                <span>Give Up</span>
              </button>
            )}

            {gameStatus === 'WON' && onViewSummary && (
              <button
                onClick={onViewSummary}
                className="flex items-center gap-1.5 rounded-lg border border-gold/50 bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold transition hover:bg-gold hover:text-cinema-black shadow-sm"
                title="View Result Summary & Otara's praise"
              >
                <span>View Results</span>
              </button>
            )}
          </div>
        </div>

        {/* Target Actor */}
        <div className="flex items-center justify-end gap-4 text-right">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">
              Target Actor
            </span>
            <h2 className="text-lg font-bold text-white sm:text-xl">{targetActor.name}</h2>
            <p className="text-xs text-cinema-muted">Goal destination</p>
          </div>
          <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border-2 border-gold bg-cinema-surface shadow-gold-glow sm:h-20 sm:w-20">
            {targetActor.profilePath ? (
              <img
                src={getTmdbImageUrl(targetActor.profilePath)}
                alt={targetActor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cinema-border/50 text-cinema-muted">
                <User className="h-8 w-8" />
              </div>
            )}
            <span className="absolute bottom-1 right-1 rounded bg-amber-950/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold border border-gold/40">
              Target
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
