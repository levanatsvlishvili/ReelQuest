import { Film, Trophy, HelpCircle, Flame, Crown } from 'lucide-react';

export function Navbar({ onOpenLeaderboard, onOpenHowToPlay, onOpenPro }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-cinema-border/70 bg-cinema-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-gold-glow">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Reel<span className="text-gold">Quest</span>
              </span>
              <span className="rounded-full bg-cinema-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cinema-muted">
                Beta
              </span>
            </div>
            <p className="text-[11px] text-cinema-muted hidden sm:block">
              Six Degrees of Hollywood Cinema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            <Flame className="h-4 w-4 fill-orange-400/20" />
            <span>3 Day Streak</span>
          </div>

          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-gold/50 hover:text-gold"
          >
            <Trophy className="h-4 w-4 text-gold" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          <button
            onClick={onOpenHowToPlay}
            className="rounded-lg border border-cinema-border bg-cinema-surface p-2 text-slate-300 transition hover:border-cinema-muted hover:text-white"
            title="How to Play"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenPro}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-3.5 py-1.5 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90"
          >
            <Crown className="h-3.5 w-3.5 fill-cinema-black" />
            <span>PRO</span>
          </button>
        </div>
      </div>
    </header>
  );
}
