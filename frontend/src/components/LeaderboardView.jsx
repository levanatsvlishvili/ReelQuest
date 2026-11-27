import { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  RefreshCw,
  Footprints,
  Clock,
  Play,
  LogIn,
  Lock,
  Zap,
  Search,
  Image,
  TrendingUp,
  Award
} from 'lucide-react';
import { fetchMultiGameLeaderboard } from '../api/leaderboardService';
import { useAuth } from '../context/AuthContext';
import { DailyDateNavigator } from './DailyDateNavigator';

const GAME_MODES = [
  { id: 'six-degrees', name: 'Beat Otara', icon: Zap },
  { id: 'frame-sleuth', name: 'Frame Sleuth', icon: Image },
  { id: 'timecode', name: 'Timecode', icon: Clock },
  { id: 'spotle', name: 'Spotle', icon: Search },
  { id: 'box-office', name: 'Box Office', icon: TrendingUp },
  { id: 'global-xp', name: 'Global XP', icon: Crown }
];

export function LeaderboardView({
  onBackToGame,
  activeChallenge,
  activeDate,
  onSelectDate,
  onOpenAuth,
  onPlayChallenge,
  onViewUserProfile
}) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedGameMode, setSelectedGameMode] = useState('six-degrees');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentGame = GAME_MODES.find(m => m.id === selectedGameMode) || GAME_MODES[0];

  useEffect(() => {
    loadData(activeTab, selectedGameMode);
  }, [activeChallenge?.challengeId, activeDate, activeTab, selectedGameMode]);

  async function loadData(tab = activeTab, mode = selectedGameMode) {
    setLoading(true);
    try {
      const data = await fetchMultiGameLeaderboard(mode, tab, activeDate, user);
      setLeaderboard(data);
    } finally {
      setLoading(false);
    }
  }

  const currentUserEntry = isAuthenticated && user
    ? leaderboard.find(entry => entry.userId === user.id || entry.username === user.username)
    : null;
  const currentUserRank = currentUserEntry
    ? (currentUserEntry.rank || leaderboard.indexOf(currentUserEntry) + 1)
    : null;

  function shiftDateStr(dateStr, days) {
    if (!dateStr || dateStr === 'Custom') return new Date().toISOString().slice(0, 10);
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + days));
    return date.toISOString().slice(0, 10);
  }

  const prevDate = shiftDateStr(activeDate, -1);
  const nextDate = shiftDateStr(activeDate, 1);
  const todayStr = new Date().toISOString().slice(0, 10);
  const canGoForward = activeDate < todayStr;

  const formatTime = (secs = 0) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const renderPrimaryMetric = (entry) => {
    if (activeTab === 'all-time' || selectedGameMode === 'global-xp') {
      if (selectedGameMode === 'global-xp') {
        return (
          <span className="font-bold text-gold text-xs sm:text-sm tabular-nums">
            {(entry.score || 0).toLocaleString()} XP
          </span>
        );
      }
      return (
        <div className="flex items-center gap-2.5 text-xs sm:text-sm">
          <span className="text-cinema-muted text-xs">{entry.gamesWon || 1} wins</span>
          <span className="font-bold text-gold tabular-nums">{(entry.score || 0).toLocaleString()} pts</span>
        </div>
      );
    }

    switch (selectedGameMode) {
      case 'spotle':
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-white">{entry.metricValue || `${entry.hops || 4} guesses`}</span>
            <span className="flex items-center gap-1 text-cinema-muted font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(entry.durationSeconds)}
            </span>
          </div>
        );
      case 'frame-sleuth':
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-white">{entry.metricValue || `Frame ${entry.hops || 1}`}</span>
            <span className="flex items-center gap-1 text-cinema-muted font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(entry.durationSeconds)}
            </span>
          </div>
        );
      case 'timecode':
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-white">{`Probe ${entry.hops || 1}`}</span>
            <span className="flex items-center gap-1 text-cinema-muted font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(entry.durationSeconds)}
            </span>
          </div>
        );
      case 'box-office':
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-white">{entry.metricValue || `${entry.hops || 5}/5`}</span>
            <span className="flex items-center gap-1 text-cinema-muted font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(entry.durationSeconds)}
            </span>
          </div>
        );
      case 'six-degrees':
      default:
        return (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-bold text-white">
              <Footprints className="h-3.5 w-3.5 text-gold" />
              {entry.hops} hops
            </span>
            <span className="flex items-center gap-1 text-cinema-muted font-mono">
              <Clock className="h-3 w-3" />
              {formatTime(entry.durationSeconds)}
            </span>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Leaderboard
          </h1>
          <p className="text-xs text-cinema-muted mt-0.5">
            {selectedGameMode === 'global-xp'
              ? 'All-around Cinephiles ranked by total Cinema XP'
              : activeTab === 'daily'
                ? `${currentGame.name} daily rankings • Ties broken by fastest time`
                : `${currentGame.name} All-Time Hall of Fame`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {selectedGameMode !== 'global-xp' && (
            <div className="inline-flex rounded-lg border border-white/[0.08] bg-cinema-surface p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'daily' ? 'bg-white/[0.1] text-white' : 'text-cinema-muted hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all-time')}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === 'all-time' ? 'bg-white/[0.1] text-white' : 'text-cinema-muted hover:text-white'
                }`}
              >
                All-Time
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadData(activeTab, selectedGameMode)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-cinema-muted hover:border-white/20 hover:text-white transition"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {selectedGameMode !== 'global-xp' && (
            <button
              type="button"
              onClick={() => onPlayChallenge(activeDate, selectedGameMode)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-gold px-3 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
            >
              <Play className="h-3 w-3 fill-cinema-black" />
              <span>Play</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-cinema-surface p-1 overflow-x-auto scrollbar-none max-w-full">
          {GAME_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedGameMode === mode.id;
            return (
              <button
                type="button"
                key={mode.id}
                onClick={() => setSelectedGameMode(mode.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 ${
                  isSelected
                    ? 'bg-white/[0.1] text-white'
                    : 'text-cinema-muted hover:text-white'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-gold' : 'text-slate-500'}`} />
                <span>{mode.name}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'daily' && selectedGameMode !== 'global-xp' && (
          <DailyDateNavigator
            currentDate={activeDate}
            onSelectDate={onSelectDate}
            onPrevDay={() => onSelectDate(prevDate)}
            onNextDay={() => {
              if (canGoForward) onSelectDate(nextDate);
            }}
            onResetToToday={() => onSelectDate(todayStr)}
            compact={true}
            embedded={true}
          />
        )}
      </div>

      {activeTab === 'daily' && selectedGameMode === 'six-degrees' && activeChallenge && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-cinema-surface/70 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-bold text-white">{activeChallenge.startActor?.name}</span>
            <span className="text-gold">→</span>
            <span className="font-bold text-white">{activeChallenge.targetActor?.name}</span>
            <span className="text-cinema-muted">• Par {activeChallenge.optimalHops || 2} hops</span>
          </div>
          <button
            type="button"
            onClick={() => onPlayChallenge(activeDate, 'six-degrees')}
            className="text-xs font-semibold text-gold hover:underline"
          >
            Play this challenge →
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Lock className="h-4 w-4 text-gold shrink-0" />
            <span className="text-slate-200">
              Sign in for free to record your scores on the official leaderboard.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 shrink-0 rounded-lg bg-gold px-3.5 py-1.5 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </button>
        </div>
      )}

      {currentUserEntry && currentUserRank > 10 && (
        <div
          onClick={() => onViewUserProfile?.({
            id: currentUserEntry.userId,
            username: currentUserEntry.username,
            isPro: currentUserEntry.isPro,
            score: currentUserEntry.score,
            moves: currentUserEntry.moves,
            streak: currentUserEntry.streak
          })}
          className="flex items-center justify-between gap-3 rounded-xl border border-gold/35 bg-gold/[0.07] px-4 py-3 cursor-pointer hover:border-gold/60 transition"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-gold">#{currentUserRank}</span>
            <span className="text-sm font-bold text-white">{currentUserEntry.username}</span>
            <span className="text-[11px] text-cinema-muted">Your Standing</span>
          </div>
          {renderPrimaryMetric(currentUserEntry)}
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-cinema-surface overflow-hidden">
          <div className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-white/[0.06] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span className="text-center">#</span>
            <span>Player</span>
            <span className="text-right">Result</span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {leaderboard.map((entry, idx) => {
              const rank = entry.rank || idx + 1;
              const isCurrentUser = user && (user.id === entry.userId || user.username === entry.username);

              return (
                <div
                  key={`${entry.userId || entry.username}-${idx}`}
                  onClick={() => onViewUserProfile?.({
                    id: entry.userId,
                    username: entry.username,
                    isPro: entry.isPro,
                    score: entry.score,
                    moves: entry.moves,
                    streak: entry.streak
                  })}
                  className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 px-4 py-3.5 cursor-pointer transition ${
                    isCurrentUser
                      ? 'bg-gold/[0.08] hover:bg-gold/[0.12]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                  title={`View ${entry.username}'s profile`}
                >
                  <div className="flex items-center justify-center">
                    {rank === 1 ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold/15 text-gold font-extrabold text-xs">
                        <Crown className="h-3.5 w-3.5 fill-gold" />
                      </span>
                    ) : rank === 2 ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-300/15 text-slate-200 font-bold text-xs">
                        2
                      </span>
                    ) : rank === 3 ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/20 text-amber-400 font-bold text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-cinema-muted tabular-nums">
                        {rank}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {entry.countryFlag && <span className="text-xs shrink-0">{entry.countryFlag}</span>}
                    <span className="text-sm font-bold text-white truncate hover:text-gold transition">
                      {entry.username}
                    </span>
                    {entry.isPro && (
                      <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-extrabold text-gold leading-none">
                        PRO
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-200 leading-none">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {renderPrimaryMetric(entry)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {leaderboard.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 rounded-2xl border border-white/[0.07] bg-cinema-surface/50 p-8">
          <Trophy className="h-8 w-8 text-gold/70" />
          <div>
            <h3 className="text-sm font-bold text-white">
              {activeTab === 'daily' ? `No scores yet for ${currentGame.name}` : 'No All-Time records yet'}
            </h3>
            <p className="mt-1 text-xs text-cinema-muted max-w-sm mx-auto">
              Complete today&apos;s challenge while signed in to claim the #1 spot.
            </p>
          </div>

          {selectedGameMode !== 'global-xp' && (
            <button
              type="button"
              onClick={() => onPlayChallenge(activeDate, selectedGameMode)}
              className="mt-1 flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
            >
              <Play className="h-3.5 w-3.5 fill-cinema-black" />
              <span>Play {currentGame.name}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
