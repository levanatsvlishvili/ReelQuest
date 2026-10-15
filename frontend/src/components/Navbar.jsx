import { Film, Trophy, HelpCircle, Flame, Crown, User, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenLeaderboard, isLeaderboardActive = false, onOpenHowToPlay, onOpenPro, onOpenAuth, onOpenProfile }) {
  const { user, stats, isAuthenticated } = useAuth();

  const currentStreak = stats?.streak ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cinema-border/70 bg-cinema-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.location.reload()}>
          <div className="relative group">
            <img
              src="/favicon.svg"
              alt="ReelQuest Logo"
              className="h-10 w-10 rounded-xl shadow-gold-glow transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-gold/20 blur-md -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
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
              The Hollywood Cinema Oracle • Beat Otara
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
            <Flame className="h-4 w-4 fill-orange-400/20" />
            <span>{currentStreak} Day Streak</span>
          </div>

          <button
            onClick={onOpenLeaderboard}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isLeaderboardActive
                ? 'border border-gold bg-gold/15 text-gold shadow-gold-glow/20'
                : 'border border-cinema-border bg-cinema-surface text-slate-200 hover:border-gold/50 hover:text-gold'
            }`}
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              user?.isPro
                ? 'border border-gold/40 bg-gold/15 text-gold shadow-gold-glow hover:bg-gold/25'
                : 'bg-gradient-to-r from-gold via-amber-400 to-gold-dark text-cinema-black shadow-gold-glow hover:opacity-90'
            }`}
          >
            <Crown className={`h-3.5 w-3.5 ${user?.isPro ? 'fill-gold text-gold' : 'fill-cinema-black text-cinema-black'}`} />
            <span className="hidden sm:inline">{user?.isPro ? 'PRO Active' : 'PRO'}</span>
          </button>

          {isAuthenticated ? (
            <button
              onClick={onOpenProfile}
              className={`flex items-center gap-2 rounded-xl border ${user?.isPro ? 'border-gold/50 shadow-gold-glow/20' : 'border-cinema-border'} bg-cinema-surface py-1 pl-2 pr-3 text-xs font-medium text-slate-200 transition hover:border-gold/60`}
            >
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${user?.isPro ? 'bg-gold text-cinema-black font-extrabold' : 'bg-gold/20 text-gold font-bold'} text-[10px]`}>
                {user?.isPro ? <Crown className="h-3 w-3 fill-cinema-black" /> : user.username.substring(0, 2).toUpperCase()}
              </div>
              <span className="max-w-[80px] truncate sm:max-w-[110px]">{user.username}</span>
              {user?.isPro && (
                <span className="hidden sm:inline-flex rounded-full bg-gold/20 px-1.5 py-0.2 text-[9px] font-bold text-gold border border-gold/30">
                  PRO
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-cinema-muted hover:text-white"
            >
              <LogIn className="h-4 w-4 text-cinema-muted" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
