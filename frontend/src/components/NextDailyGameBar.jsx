import { useState, useEffect } from 'react';
import { ArrowRight, Trophy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DAILY_GAMES,
  getDailyGamesStatus,
  getNextUnplayedDailyGame,
  subscribeDailyProgress
} from '../utils/dailyProgress';

export function NextDailyGameBar({ currentMode, onSelectGame, onOpenLeaderboard, compact = false }) {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [statusMap, setStatusMap] = useState(() => getDailyGamesStatus(user?.id, todayStr));

  useEffect(() => {
    setStatusMap(getDailyGamesStatus(user?.id, todayStr));
    return subscribeDailyProgress(() => {
      setStatusMap(getDailyGamesStatus(user?.id, todayStr));
    });
  }, [user?.id, todayStr]);

  const completedCount = DAILY_GAMES.filter(g => statusMap[g.id]?.done).length;
  const nextGame = getNextUnplayedDailyGame(currentMode, user?.id, todayStr);

  if (!onSelectGame && !onOpenLeaderboard) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] ${
        compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 text-left">
        {nextGame ? (
          <div className="flex items-center gap-1 shrink-0">
            {DAILY_GAMES.map(g => (
              <span
                key={g.id}
                className={`h-2 w-2 rounded-full ${
                  statusMap[g.id]?.done ? 'bg-emerald-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        )}
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gold block leading-tight">
            {nextGame ? `Daily Progress • ${completedCount}/4` : 'Daily Sweep • 4/4 Complete'}
          </span>
          <p className="text-xs font-semibold text-slate-200 truncate">
            {nextGame
              ? `Keep playing — try today’s ${nextGame.name}`
              : 'You completed every daily ReelQuest challenge today!'}
          </p>
        </div>
      </div>

      {nextGame && onSelectGame ? (
        <button
          type="button"
          onClick={() => onSelectGame(nextGame.id)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition active:scale-95 shrink-0"
        >
          <span>Next: {nextGame.shortName}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : onOpenLeaderboard ? (
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition active:scale-95 shrink-0"
        >
          <Trophy className="h-3.5 w-3.5" />
          <span>View Leaderboard</span>
        </button>
      ) : null}
    </div>
  );
}
