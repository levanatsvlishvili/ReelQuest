import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Share2,
  RotateCcw,
  Check,
  X,
  ArrowRight,
  Clock,
  Footprints,
  User,
  Film
} from 'lucide-react';
import { NextDailyGameBar } from './NextDailyGameBar';

export function VictoryModal({
  isOpen,
  onClose,
  gameStatus,
  challenge,
  moves,
  timerSeconds,
  optimalPath,
  onRestart,
  onOpenLeaderboard,
  onSelectGame
}) {
  const [copied, setCopied] = useState(false);

  const isWon = gameStatus === 'WON';

  useEffect(() => {
    if (isOpen && isWon) {
      confetti({
        particleCount: 110,
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

  const generateShareText = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reelquest.io';
    const formattedDate = challenge.date
      ? new Date(challenge.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Daily';

    const blocks = Array.from({ length: moves }, (_, i) => (i < optimalHops ? '🟩' : '🟨')).join('');
    const statusLine = isOptimal
      ? `🏆 Matched Otara's Optimal Route!`
      : `🎬 Solved in ${moves} hops (Otara: ${optimalHops})`;

    return [
      `🎬 ReelQuest Daily • ${formattedDate}`,
      `🎭 ${challenge.startActor?.name || 'Actor'} ➔ ${challenge.targetActor?.name || 'Target'}`,
      statusLine,
      `🎯 ${moves} Hops | ⏱️ ${timeFormatted}`,
      `${blocks} ${isOptimal ? '⭐' : '🎬'}`,
      '',
      'Can you beat Otara?',
      `👉 ${shareUrl}`
    ].join('\n');
  };

  const handleShare = async () => {
    const text = generateShareText();
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://reelquest.io';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ReelQuest Daily Score',
          text,
          url: shareUrl
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-cinema-card p-6 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="relative mx-auto mb-3 h-28 w-24 sm:h-32 sm:w-28 animate-otara-float">
            <img
              src={
                isWon && isOptimal
                  ? '/assets/otara/otara-impressed.png'
                  : '/assets/otara/otara-encouraging.png'
              }
              alt="Otara Reaction"
              className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
            />
          </div>

          <h2 className="text-xl font-extrabold text-white">
            {isWon
              ? isOptimal
                ? "Matched Otara's Par!"
                : 'Connection Complete'
              : "Otara's Optimal Route"}
          </h2>

          <p className="mt-1.5 text-xs sm:text-sm text-cinema-muted px-2">
            {isWon
              ? isOptimal
                ? `"Brilliant! You matched my optimal route in ${moves} hops."`
                : `"Solved in ${moves} hops! My shortest route was ${optimalHops} hops."`
              : '"Even master directors need a second take. Here is the optimal route:"'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-cinema-surface p-3">
            <Footprints className="h-4 w-4 text-gold shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cinema-muted block">Your Hops</span>
              <span className="text-base font-bold text-white">
                {moves} <span className="text-xs text-cinema-muted font-normal">/ Par {optimalHops}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-cinema-surface p-3">
            <Clock className="h-4 w-4 text-gold shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-cinema-muted block">Time</span>
              <span className="text-base font-bold font-mono text-white">{timeFormatted}</span>
            </div>
          </div>
        </div>

        {isWon && (
          <div className="flex items-center justify-center gap-1.5 py-1 select-none">
            {Array.from({ length: moves }).map((_, i) => (
              <span
                key={i}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs ${
                  i < optimalHops
                    ? 'bg-emerald-500/20 border border-emerald-500/40'
                    : 'bg-amber-500/20 border border-amber-500/40'
                }`}
              >
                {i < optimalHops ? '🟩' : '🟨'}
              </span>
            ))}
          </div>
        )}

        {optimalPath && optimalPath.length > 0 ? (
          <div className="rounded-xl border border-white/[0.08] bg-cinema-surface p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold block mb-2.5">
              Optimal Route ({optimalPath.length} hops)
            </span>
            <div className="space-y-2">
              {optimalPath.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <User className="h-3.5 w-3.5 text-cinema-muted" />
                    {step.actor?.name}
                  </span>
                  <ArrowRight className="h-3 w-3 text-cinema-muted shrink-0" />
                  <span className="flex items-center gap-1.5 rounded bg-cinema-card px-2 py-0.5 text-gold border border-white/[0.08]">
                    <Film className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[130px]">{step.movie?.title}</span>
                  </span>
                  <ArrowRight className="h-3 w-3 text-cinema-muted shrink-0" />
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <User className="h-3.5 w-3.5 text-cinema-muted" />
                    {step.nextActor?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-cinema-surface/50 p-3 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-cinema-muted">
              <div className="h-3.5 w-3.5 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
              <span>Computing optimal route...</span>
            </div>
          </div>
        )}

        <NextDailyGameBar
          currentMode="six-degrees"
          compact={true}
          onSelectGame={(modeId) => {
            onClose();
            onSelectGame?.(modeId);
          }}
          onOpenLeaderboard={() => {
            onClose();
            onOpenLeaderboard?.();
          }}
        />

        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-xs font-extrabold text-cinema-black transition hover:bg-amber-300"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? 'Copied!' : 'Share Score'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenLeaderboard();
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-cinema-surface py-2.5 text-xs font-semibold text-slate-200 transition hover:border-gold/40 hover:text-gold"
          >
            <Trophy className="h-4 w-4 text-gold" />
            <span>Leaderboard</span>
          </button>
        </div>

        <div className="text-center">
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
