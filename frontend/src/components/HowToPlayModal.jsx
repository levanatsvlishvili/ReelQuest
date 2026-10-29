import React from 'react';
import { X, Film, Users, Target, Zap, Trophy, Undo2, Flame, Sparkles } from 'lucide-react';

export function HowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gold/40 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 sm:p-7 shadow-2xl scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-cinema-border/70 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-gold-glow">
            <Film className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
              How to Play: <span className="text-gold">Beat Otara</span>
            </h3>
            <p className="text-xs text-cinema-muted">
              The Six Degrees of Hollywood Cinema Connection Game
            </p>
          </div>
        </div>

        {/* Core Objective Banner */}
        <div className="my-5 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-xs leading-relaxed text-slate-200">
          <strong className="text-gold font-bold uppercase tracking-wider block mb-1">
            🎯 Mission Objective
          </strong>
          Navigate the global Hollywood filmography graph to connect the <strong>Start Star</strong> to the <strong>Target Star</strong> through shared movies and co-stars in the <strong>fewest possible hops</strong>.
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/50 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 font-black text-sm">
              1
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Film className="h-4 w-4 text-gold" />
                <span>Choose a Film from the Actor's Filmography</span>
              </h4>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Start from the origin actor and select any movie in which they played a credited role.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/50 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 font-black text-sm">
              2
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" />
                <span>Select a Co-Star from that Movie</span>
              </h4>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Choose any co-star who appeared in that exact same film to carry the link forward.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/50 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 font-black text-sm">
              3
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-gold" />
                <span>Reach the Target Star</span>
              </h4>
              <p className="text-xs text-cinema-muted leading-relaxed">
                Repeat the chain until one of your chosen co-stars matches today's destination actor. The connection completes automatically!
              </p>
            </div>
          </div>

          {/* Example Box */}
          <div className="rounded-xl border border-cinema-border bg-cinema-black/60 p-3 text-center">
            <span className="text-[10px] font-black uppercase text-cinema-muted tracking-wider block mb-1">
              Example 1-Hop Chain:
            </span>
            <div className="flex items-center justify-center gap-2 text-xs font-bold flex-wrap">
              <span className="text-white">Tom Hanks</span>
              <span className="text-cinema-muted">→</span>
              <span className="text-gold italic">"Apollo 13"</span>
              <span className="text-cinema-muted">→</span>
              <span className="text-emerald-400">Kevin Bacon</span>
              <span className="rounded bg-gold/20 px-2 py-0.5 text-[10px] text-gold font-mono ml-1">
                (1 Hop)
              </span>
            </div>
          </div>

          {/* Step 4: Otara's Par Benchmark */}
          <div className="flex gap-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Zap className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Beat Otara (The Cinema Oracle)</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Otara computes the true mathematical shortest path for every daily challenge (usually 2 to 3 hops). If your completed chain matches Otara's Par, you achieve the prestigious <strong>"Matched Otara"</strong> victory and bonus Cinema XP!
              </p>
            </div>
          </div>

          {/* Strategic Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-3 flex items-start gap-2">
              <Undo2 className="h-4 w-4 text-cinema-muted shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Infinite Undo</strong>
                <span className="text-cinema-muted text-[11px]">
                  Hit a dead end? Click Undo to backtrack to any previous node in your chain without penalty.
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-3 flex items-start gap-2">
              <Flame className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Daily Streak & XP</strong>
                <span className="text-cinema-muted text-[11px]">
                  Every daily win keeps your streak burning, increases your multiplier, and unlocks level trophies.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Button */}
        <div className="mt-6 pt-4 border-t border-cinema-border/70">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark py-3 text-xs font-black text-cinema-black shadow-gold-glow transition hover:opacity-90 active:scale-95"
          >
            Understood — Let's Beat Otara!
          </button>
        </div>
      </div>
    </div>
  );
}
