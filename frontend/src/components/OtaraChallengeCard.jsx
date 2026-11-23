import React from 'react';
import { Play, Trophy, ArrowRight, Swords, User } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';
import { playClick } from '../utils/soundEffects';
import { NextDailyGameBar } from './NextDailyGameBar';

export function OtaraChallengeCard({
  challenge,
  gameStatus,
  moves = 0,
  onStart,
  onOpenSummary,
  onOpenDuel,
  onSelectGame,
  onOpenLeaderboard
}) {
  if (!challenge) return null;

  const optimalHops = challenge.optimalHops || 2;
  const isReady = gameStatus === 'READY';
  const isWon = gameStatus === 'WON';
  const isGaveUp = gameStatus === 'GAVE_UP';
  const isFinished = isWon || isGaveUp;
  const matchedOtara = isWon && moves <= optimalHops;

  const handleStartClick = () => {
    playClick();
    onStart?.();
  };

  const handleDuelClick = () => {
    playClick();
    onOpenDuel?.();
  };

  if (isReady) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/[0.08] bg-cinema-surface p-6 sm:p-8 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative h-52 w-32 sm:h-60 sm:w-36 animate-otara-float">
              <img
                src="/assets/otara/otara-challenge.png"
                alt="Otara - Cinema Oracle"
                className="h-full w-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]"
              />
            </div>
            <span className="-mt-1 text-[11px] font-bold uppercase tracking-widest text-gold">
              Otara • Par {optimalHops}
            </span>
          </div>

          <div className="flex-1 space-y-5 text-center md:text-left">
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold">
                Daily Six Degrees Challenge
              </p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                &ldquo;I found the link in <span className="text-gold">{optimalHops} hops</span>. Can you match it?&rdquo;
              </h2>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 sm:gap-4 rounded-xl border border-white/[0.07] bg-cinema-black/50 p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-emerald-500/50 bg-cinema-card">
                  {challenge.startActor?.profilePath ? (
                    <img
                      src={getTmdbImageUrl(challenge.startActor.profilePath)}
                      alt={challenge.startActor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Start</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate block">{challenge.startActor?.name}</span>
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-gold shrink-0" />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gold bg-cinema-card">
                  {challenge.targetActor?.profilePath ? (
                    <img
                      src={getTmdbImageUrl(challenge.targetActor.profilePath)}
                      alt={challenge.targetActor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-cinema-muted">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">Target</span>
                  <span className="text-xs sm:text-sm font-bold text-white truncate block">{challenge.targetActor?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <button
                type="button"
                onClick={handleStartClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-extrabold text-cinema-black hover:bg-amber-300 transition active:scale-95"
              >
                <Play className="h-4 w-4 fill-cinema-black" />
                <span>Start Challenge</span>
              </button>

              {onOpenDuel && (
                <button
                  type="button"
                  onClick={handleDuelClick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-cinema-card px-4 py-3 text-sm font-semibold text-slate-200 hover:border-gold/50 hover:text-gold transition active:scale-95"
                >
                  <Swords className="h-4 w-4 text-gold" />
                  <span>1v1 Online Duel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const isImpressed = matchedOtara;
    const mascotImg = isImpressed ? '/assets/otara/otara-impressed.png' : '/assets/otara/otara-encouraging.png';

    return (
      <div className="space-y-3 animate-fade-in">
        <div className={`rounded-2xl border p-4 sm:p-5 ${
          isImpressed ? 'border-gold/40 bg-gold/[0.06]' : 'border-white/[0.08] bg-cinema-surface'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative h-24 w-20 shrink-0 animate-otara-float">
              <img
                src={mascotImg}
                alt="Otara Reaction"
                className="h-full w-full object-contain filter drop-shadow-[0_10px_18px_rgba(0,0,0,0.8)]"
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold block">
                {isImpressed ? 'Otara is Impressed' : "Otara's Verdict"}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isImpressed
                  ? `"Brilliant! You matched my optimal route in ${moves} hops!"`
                  : isWon
                    ? `"Well played! Solved in ${moves} hops (Par ${optimalHops})."`
                    : '"Even master directors need a second take. Inspect the optimal route!"'}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenDuel && (
                <button
                  type="button"
                  onClick={handleDuelClick}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-cinema-card px-3 py-2 text-xs font-semibold text-slate-200 hover:border-gold/40 hover:text-gold transition"
                >
                  <Swords className="h-3.5 w-3.5 text-gold" />
                  <span>1v1 Duel</span>
                </button>
              )}
              {onOpenSummary && (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    onOpenSummary();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>View Results</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <NextDailyGameBar
          currentMode="six-degrees"
          onSelectGame={onSelectGame}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      </div>
    );
  }

  return null;
}
