import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Share2,
  RotateCcw,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Footprints,
  User,
  Film
} from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';

export function VictoryModal({
  isOpen,
  onClose,
  gameStatus,
  challenge,
  moves,
  timerSeconds,
  optimalPath,
  onRestart,
  onOpenLeaderboard
}) {
  const [copied, setCopied] = useState(false);

  const isWon = gameStatus === 'WON';

  useEffect(() => {
    if (isOpen && isWon) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F5E6B3', '#FFFFFF', '#FFD700']
      });
    }
  }, [isOpen, isWon]);

  if (!isOpen || !challenge) return null;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const optimalHops = challenge.optimalHops || 2;
  const isOptimal = moves <= optimalHops;

  const handleShare = () => {
    const squares = Array.from({ length: moves }, (_, i) => (i < optimalHops ? '🟩' : '🟨')).join('');
    const text = `🎬 ReelQuest Daily #${challenge.date}\n` +
      `${challenge.startActor.name} ➔ ${challenge.targetActor.name}\n` +
      `🎯 ${moves} Hops (Optimal: ${optimalHops}) | ⏱️ ${timeFormatted}\n` +
      `${squares}\n` +
      `Play now: https://reelquest.io`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gold/40 bg-gradient-to-b from-cinema-card to-cinema-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          {/* Otara Reaction Mascot Badge (Unboxed Transparent Cutout) */}
          <div className="relative mx-auto mb-3 h-32 w-28 sm:h-36 sm:w-32 animate-otara-float">
            <img
              src={
                isWon
                  ? isOptimal
                    ? '/assets/otara/otara-impressed.png'
                    : '/assets/otara/otara-encouraging.png'
                  : '/assets/otara/otara-encouraging.png'
              }
              alt="Otara Reaction"
              className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_20px_rgba(230,175,46,0.3)]"
            />
          </div>

          <h2 className="text-xl font-extrabold text-white sm:text-2xl">
            {isWon
              ? isOptimal
                ? "🏆 Tied Otara's Benchmark!"
                : '🎬 Cinematic Connection Complete!'
              : "🎬 Otara's Optimal Route"}
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 italic px-2">
            {isWon
              ? isOptimal
                ? `"Brilliant! You matched my optimal route in ${moves} hops! A true cinephile!"`
                : `"Well played! You reached the target in ${moves} hops! My shortest path was ${optimalHops} hops. Check my route below!"`
              : '"No worries! Even master directors need a second take. Here is my optimal path:"'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="my-5 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <Footprints className="h-5 w-5 text-gold" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cinema-muted block">Your Hops</span>
              <span className="text-base font-bold text-white sm:text-lg">
                {moves} <span className="text-xs text-cinema-muted">/ opt {optimalHops}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <Clock className="h-5 w-5 text-gold" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cinema-muted block">Elapsed Time</span>
              <span className="text-base font-bold font-mono text-white sm:text-lg">{timeFormatted}</span>
            </div>
          </div>
        </div>

        {/* Shortest Path Reveal */}
        {optimalPath && optimalPath.length > 0 ? (
          <div className="mb-6 rounded-xl border border-cinema-border bg-cinema-surface/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gold">
                Optimal Shortest Route ({optimalPath.length} hops)
              </span>
              <span className="text-[10px] text-cinema-muted">Computed by BFS Engine</span>
            </div>

            <div className="space-y-2">
              {optimalPath.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <User className="h-3.5 w-3.5 text-cinema-muted" />
                    <span>{step.actor?.name}</span>
                  </div>

                  <ArrowRight className="h-3 w-3 text-cinema-muted shrink-0" />

                  <div className="flex items-center gap-1.5 rounded bg-cinema-card px-2 py-0.5 text-gold border border-cinema-border">
                    <Film className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[130px]">{step.movie?.title}</span>
                  </div>

                  <ArrowRight className="h-3 w-3 text-cinema-muted shrink-0" />

                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <User className="h-3.5 w-3.5 text-cinema-muted" />
                    <span className="font-semibold text-white">{step.nextActor?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-cinema-border/50 bg-cinema-surface/40 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-cinema-muted">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
              <span>Computing optimal Hollywood path...</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Share Score'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenLeaderboard();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-card py-2.5 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:text-gold"
          >
            <Trophy className="h-4 w-4 text-gold" />
            <span>View Leaderboard</span>
          </button>
        </div>

        <div className="mt-3 text-center">
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs text-cinema-muted transition hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Play again from start</span>
          </button>
        </div>
      </div>
    </div>
  );
}
