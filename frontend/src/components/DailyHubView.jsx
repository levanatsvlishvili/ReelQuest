import { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  Flame,
  Swords,
  Sparkles,
  Trophy,
  Camera,
  Film,
  TrendingUp,
  GitFork,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateGameStreak } from '../api/auth';
import {
  DAILY_GAMES,
  getDailyGamesStatus,
  subscribeDailyProgress
} from '../utils/dailyProgress';

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

const MODE_ICONS = {
  'six-degrees': GitFork,
  'frame-sleuth': Camera,
  timecode: Clock,
  spotle: Film,
  'box-office': TrendingUp
};

export function DailyHubView({
  challenge,
  onSelectGame,
  onOpenDuel,
  onOpenPathFinder,
  onOpenLeaderboard
}) {
  const { user, stats } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [statusMap, setStatusMap] = useState(() => getDailyGamesStatus(user?.id, todayStr));

  useEffect(() => {
    setStatusMap(getDailyGamesStatus(user?.id, todayStr));
    return subscribeDailyProgress(() => {
      setStatusMap(getDailyGamesStatus(user?.id, todayStr));
    });
  }, [user?.id, todayStr]);

  const completedCount = DAILY_GAMES.filter((g) => statusMap[g.id]?.done).length;
  const formattedDate = new Date(`${todayStr}T12:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const bestStreak = Math.max(
    stats?.streak || 0,
    calculateGameStreak('six-degrees', user?.id, todayStr),
    calculateGameStreak('frame-sleuth', user?.id, todayStr),
    calculateGameStreak('timecode', user?.id, todayStr),
    calculateGameStreak('spotle', user?.id, todayStr),
    calculateGameStreak('box-office', user?.id, todayStr)
  );

  return (
    <div className="mx-auto max-w-4xl py-4 sm:py-8 space-y-8 animate-fade-in">
      <section className="text-center space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
          {formattedDate} • Daily Edition
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Today&apos;s Cinema Reel
        </h1>
        <p className="text-sm text-cinema-muted max-w-lg mx-auto">
          Five quick daily movie challenges. Play solo, keep your streak alive, or duel a friend.
        </p>

        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-cinema-surface px-4 py-1.5 text-xs font-semibold text-slate-200">
            <span>
              Daily Progress: <strong className="text-white">{completedCount} of {DAILY_GAMES.length}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              {DAILY_GAMES.map((g) => (
                <span
                  key={g.id}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    statusMap[g.id]?.done ? 'bg-emerald-400' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
            {bestStreak > 0 && (
              <span className="inline-flex items-center gap-1 text-gold font-bold pl-1 border-l border-white/10">
                <Flame className="h-3.5 w-3.5 fill-gold text-gold" />
                {bestStreak}d
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DAILY_GAMES.map((game) => {
          const st = statusMap[game.id] || { done: false, won: false, summary: null };
          const Icon = MODE_ICONS[game.id] || Film;
          const isOtara = game.id === 'six-degrees';

          return (
            <div
              key={game.id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 ${
                isOtara
                  ? 'md:col-span-2 border-gold/30 bg-gradient-to-br from-gold/[0.06] via-cinema-surface to-cinema-surface hover:border-gold/50'
                  : 'border-white/[0.08] bg-cinema-surface hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
                      isOtara
                        ? 'border-gold/30 bg-gold/10 text-gold'
                        : 'border-white/10 bg-cinema-card text-slate-300'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">
                      {game.name}
                    </h2>
                    {game.id === 'timecode' && (
                      <span className="rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-extrabold text-gold uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>

                  {isOtara && challenge?.startActor && challenge?.targetActor ? (
                    <p className="text-sm text-cinema-muted leading-relaxed">
                      Connect <strong className="text-slate-100 font-semibold">{challenge.startActor.name}</strong> to{' '}
                      <strong className="text-slate-100 font-semibold">{challenge.targetActor.name}</strong>{' '}
                      <span className="text-gold/90 font-semibold">(Par {challenge.optimalHops || 2})</span>.
                    </p>
                  ) : (
                    <p className="text-sm text-cinema-muted leading-relaxed">
                      {game.tagline}
                    </p>
                  )}
                </div>

                {isOtara ? (
                  <img
                    src="/assets/otara/otara-challenge.png"
                    alt="Otara"
                    className="h-20 w-14 shrink-0 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.75)] transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      st.done
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-white/[0.05] text-cinema-muted'
                    }`}
                  >
                    {st.done && <Check className="h-3 w-3" />}
                    <span>{st.done ? st.summary : 'Not Played'}</span>
                  </span>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
                {isOtara ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {st.done ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                        <Check className="h-3 w-3" />
                        <span>{st.summary}</span>
                      </span>
                    ) : (
                      <a
                        href="/duel"
                        onClick={(e) => {
                          if (isModifiedClick(e)) return;
                          e.preventDefault();
                          onOpenDuel?.();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-cinema-card px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-gold/40 hover:text-gold transition"
                      >
                        <Swords className="h-3.5 w-3.5" />
                        <span>1v1 Duel</span>
                      </a>
                    )}
                    <a
                      href="/path-finder"
                      onClick={(e) => {
                        if (isModifiedClick(e)) return;
                        e.preventDefault();
                        onOpenPathFinder?.();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gold/85 hover:text-gold transition"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Path Finder</span>
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-medium">
                    {game.id === 'spotle'
                      ? '5,000+ film catalog'
                      : game.id === 'frame-sleuth'
                        ? 'Smart 3.8× → 1.0× camera zoom'
                        : game.id === 'timecode'
                          ? '6 timestamp probes'
                          : 'Daily 5-Round + Endless'}
                  </span>
                )}

                <a
                  href={game.path}
                  onClick={(e) => {
                    if (isModifiedClick(e)) return;
                    e.preventDefault();
                    onSelectGame(game.id);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                    st.done
                      ? 'border border-white/10 bg-cinema-card text-slate-200 hover:border-white/25 hover:text-white'
                      : 'bg-gold text-cinema-black hover:bg-amber-300'
                  }`}
                >
                  <span>{st.done ? 'Review' : 'Play'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </section>

      {completedCount === DAILY_GAMES.length && (
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/[0.06] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Daily Sweep Complete ({DAILY_GAMES.length}/{DAILY_GAMES.length})</h3>
              <p className="text-xs text-cinema-muted">
                You completed every ReelQuest daily challenge today. Check where you rank!
              </p>
            </div>
          </div>
          <a
            href="/leaderboard"
            onClick={(e) => {
              if (isModifiedClick(e)) return;
              e.preventDefault();
              onOpenLeaderboard?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition shrink-0"
          >
            <span>View Leaderboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </section>
      )}
    </div>
  );
}
