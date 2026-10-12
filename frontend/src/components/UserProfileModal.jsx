import { X, Crown, Flame, Trophy, Footprints, LogOut, Sparkles, Check, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function UserProfileModal({ isOpen, onClose, onOpenPro }) {
  const { user, stats, logout } = useAuth();

  if (!isOpen || !user) return null;

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const initials = (user.username || user.email || 'U').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Header */}
        <div className="flex items-center gap-4 border-b border-cinema-border pb-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-lg font-black text-gold border border-gold/30 shadow-gold-glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{user.username}</h3>
              {user.isPro ? (
                <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                  <Crown className="h-3 w-3 fill-gold" />
                  PRO
                </span>
              ) : (
                <span className="rounded-full bg-cinema-border px-2 py-0.5 text-[10px] font-semibold text-cinema-muted">
                  Free Member
                </span>
              )}
            </div>
            <p className="truncate text-xs text-cinema-muted">{user.email}</p>
          </div>
        </div>

        {/* Pro Banner if Free */}
        {!user.isPro && (
          <div className="my-4 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="text-xs font-semibold text-gold">Unlock Pro Features</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenPro();
              }}
              className="rounded-lg bg-gold px-2.5 py-1 text-xs font-bold text-cinema-black hover:opacity-90"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Stats Metrics */}
        <div className="my-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <div className="flex items-center gap-1.5 text-xs text-orange-400">
              <Flame className="h-4 w-4 fill-orange-400/20" />
              <span className="font-semibold">Streak</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{stats.streak} Days</div>
          </div>

          <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <Trophy className="h-4 w-4" />
              <span className="font-semibold">Win Rate</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{winRate}%</div>
          </div>

          <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <div className="flex items-center gap-1.5 text-xs text-cinema-muted">
              <Footprints className="h-4 w-4 text-gold" />
              <span className="font-semibold">Best Hops</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{stats.bestHops || 2}</div>
          </div>

          <div className="rounded-xl border border-cinema-border bg-cinema-surface p-3">
            <div className="flex items-center gap-1.5 text-xs text-cinema-muted">
              <Clock className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold">Games Played</span>
            </div>
            <div className="mt-1 text-xl font-bold text-white">{stats.gamesPlayed}</div>
          </div>
        </div>

        {/* Recent History */}
        {stats.history && stats.history.length > 0 && (
          <div className="mb-5 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cinema-muted">
              Recent Game Activity
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {stats.history.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-cinema-border/50 bg-cinema-surface/60 px-3 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {h.won ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-red-400" />
                    )}
                    <span className="text-slate-200">{h.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-cinema-muted">
                    <span>{h.hops} hops</span>
                    {h.duration && <span>{h.duration}s</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface py-2.5 text-xs font-semibold text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
