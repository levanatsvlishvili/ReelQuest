import { useState, useEffect } from 'react';
import { 
  Trophy, Crown, ArrowLeft, RefreshCw, Calendar, Flame, Medal, Footprints, 
  Clock, Play, Sparkles, User, LogIn, Lock, Swords, Zap
} from 'lucide-react';
import { fetchLeaderboard, getTmdbImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DailyDateNavigator } from './DailyDateNavigator';

export function LeaderboardView({ 
  onBackToGame, 
  activeChallenge,
  activeDate,
  onSelectDate,
  onOpenAuth,
  onPlayChallenge
}) {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'all-time'
  const [selectedGameMode, setSelectedGameMode] = useState('six-degrees');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData(activeTab);
  }, [activeChallenge?.challengeId, activeDate, activeTab]);

  async function loadData(tab = activeTab) {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(activeChallenge?.challengeId, tab);
      setLeaderboard(data);
    } finally {
      setLoading(false);
    }
  }

  const top3 = leaderboard.slice(0, 3);
  const restLeaderboard = leaderboard.slice(3);

  // Helper to shift date for date switcher
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

  const renderCard1 = (entry, isSolo = false) => (
    <div className={`flex flex-col justify-between rounded-2xl border-2 border-gold/70 bg-gradient-to-b from-gold/20 via-cinema-card to-cinema-card p-6 shadow-gold-glow ${!isSolo ? 'order-1 md:order-2 md:-translate-y-2' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-500/50 px-3 py-1.5 text-xs font-black text-amber-400 shadow-sm">
          <Crown className="h-4 w-4 fill-amber-400" />
          #1 CHAMPION
        </span>
        {entry.isPro && (
          <span className="flex items-center gap-0.5 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/40">
            PRO
          </span>
        )}
      </div>

      <div className="my-5 text-center">
        <h4 className="text-lg sm:text-xl font-extrabold text-white truncate">{entry.username}</h4>
        <span className="text-xs font-semibold text-gold">
          {activeTab === 'daily' ? `${entry.hops} Hops Champion` : 'All-Time Grandmaster'}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-gold/30 pt-3 text-xs">
        {activeTab === 'daily' ? (
          <>
            <div className="flex items-center gap-1.5 font-bold text-slate-100">
              <Footprints className="h-4 w-4 text-gold" />
              <span>{entry.hops} hops</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-slate-300">
              <Clock className="h-4 w-4 text-gold" />
              <span>{Math.floor((entry.durationSeconds || 0) / 60)}m {(entry.durationSeconds || 0) % 60}s</span>
            </div>
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-300">{entry.moves || 1} games won</span>
            <span className="text-sm font-extrabold text-gold">{(entry.score || 0).toLocaleString()} pts</span>
          </>
        )}
      </div>
    </div>
  );

  const renderCard2 = (entry) => (
    <div className="order-2 md:order-1 flex flex-col justify-between rounded-2xl border border-slate-300/40 bg-cinema-surface/80 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-xl bg-slate-300/20 border border-slate-300/40 px-3 py-1 text-xs font-bold text-slate-200 shadow-sm">
          <Medal className="h-4 w-4 text-slate-300" />
          #2 RUNNER UP
        </span>
        {entry.isPro && (
          <span className="flex items-center gap-0.5 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
            <Crown className="h-3 w-3" />
            PRO
          </span>
        )}
      </div>

      <div className="my-4 text-center">
        <h4 className="text-base sm:text-lg font-bold text-white truncate">{entry.username}</h4>
        <span className="text-[11px] text-cinema-muted">Rank #2 Cinephile</span>
      </div>

      <div className="flex items-center justify-between border-t border-cinema-border/50 pt-3 text-xs">
        {activeTab === 'daily' ? (
          <>
            <div className="flex items-center gap-1 text-slate-200">
              <Footprints className="h-3.5 w-3.5 text-gold" />
              <span>{entry.hops} hops</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-cinema-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{Math.floor((entry.durationSeconds || 0) / 60)}m {(entry.durationSeconds || 0) % 60}s</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-cinema-muted">{entry.moves || 1} games won</span>
            <span className="font-bold text-gold">{(entry.score || 0).toLocaleString()} pts</span>
          </>
        )}
      </div>
    </div>
  );

  const renderCard3 = (entry) => (
    <div className="order-3 flex flex-col justify-between rounded-2xl border border-amber-700/40 bg-cinema-surface/80 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-xl bg-amber-700/20 border border-amber-700/40 px-3 py-1 text-xs font-bold text-amber-500 shadow-sm">
          <Medal className="h-4 w-4 text-amber-600" />
          #3 BRONZE
        </span>
        {entry.isPro && (
          <span className="flex items-center gap-0.5 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
            <Crown className="h-3 w-3" />
            PRO
          </span>
        )}
      </div>

      <div className="my-4 text-center">
        <h4 className="text-base sm:text-lg font-bold text-white truncate">{entry.username}</h4>
        <span className="text-[11px] text-cinema-muted">Rank #3 Cinephile</span>
      </div>

      <div className="flex items-center justify-between border-t border-cinema-border/50 pt-3 text-xs">
        {activeTab === 'daily' ? (
          <>
            <div className="flex items-center gap-1 text-slate-200">
              <Footprints className="h-3.5 w-3.5 text-gold" />
              <span>{entry.hops} hops</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-cinema-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>{Math.floor((entry.durationSeconds || 0) / 60)}m {(entry.durationSeconds || 0) % 60}s</span>
            </div>
          </>
        ) : (
          <>
            <span className="text-cinema-muted">{entry.moves || 1} games won</span>
            <span className="font-bold text-gold">{(entry.score || 0).toLocaleString()} pts</span>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-cinema-border/70 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGame}
            className="group flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Game</span>
          </button>
          
          <div className="h-5 w-px bg-cinema-border hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold" />
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                ReelQuest Leaderboard
              </h1>
            </div>
            <p className="text-xs text-cinema-muted">
              Official Hollywood Six Degrees Hall of Fame & Daily Rankings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => loadData(activeTab)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-cinema-muted transition hover:border-cinema-muted hover:text-white"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {activeChallenge && (
            <button
              onClick={() => onPlayChallenge(activeDate)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-3.5 py-2 text-xs font-bold text-cinema-black shadow-gold-glow transition hover:opacity-90"
            >
              <Play className="h-3.5 w-3.5 fill-cinema-black" />
              <span>Play Today&apos;s Challenge</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Mode Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-cinema-border/50">
        <button
          onClick={() => setSelectedGameMode('six-degrees')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition border ${
            selectedGameMode === 'six-degrees'
              ? 'border-gold/50 bg-gold/15 text-gold shadow-gold-glow/20'
              : 'border-cinema-border/60 bg-cinema-surface/40 text-cinema-muted hover:text-white hover:border-cinema-muted'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Six Degrees</span>
          <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
            ACTIVE
          </span>
        </button>

        <button
          disabled
          className="flex items-center gap-2 rounded-xl border border-cinema-border/40 bg-cinema-surface/20 px-4 py-2 text-xs font-semibold text-cinema-muted/60 cursor-not-allowed opacity-75"
        >
          <Zap className="h-4 w-4 text-cinema-muted/60" />
          <span>Speed Rush</span>
          <span className="rounded-full bg-cinema-border/60 px-1.5 py-0.2 text-[9px] font-medium text-cinema-muted/70">
            SOON
          </span>
        </button>

        <button
          disabled
          className="flex items-center gap-2 rounded-xl border border-cinema-border/40 bg-cinema-surface/20 px-4 py-2 text-xs font-semibold text-cinema-muted/60 cursor-not-allowed opacity-75"
        >
          <Swords className="h-4 w-4 text-cinema-muted/60" />
          <span>Head-to-Head Duels</span>
          <span className="rounded-full bg-cinema-border/60 px-1.5 py-0.2 text-[9px] font-medium text-cinema-muted/70">
            SOON
          </span>
        </button>
      </div>

      {/* Scope Switcher Tabs: Daily Challenge vs All-Time Legends */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-cinema-border bg-cinema-surface p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'daily'
                ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                : 'text-cinema-muted hover:text-slate-200 border border-transparent'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Daily Challenge</span>
          </button>

          <button
            onClick={() => setActiveTab('all-time')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
              activeTab === 'all-time'
                ? 'bg-gold/20 text-gold shadow-sm border border-gold/40'
                : 'text-cinema-muted hover:text-slate-200 border border-transparent'
            }`}
          >
            <Medal className="h-4 w-4" />
            <span>All-Time Hall of Fame</span>
          </button>
        </div>

        {/* Date Selector (Only when Daily is selected) */}
        {activeTab === 'daily' && (
          <div className="w-full sm:w-auto">
            <DailyDateNavigator
              currentDate={activeDate}
              onSelectDate={onSelectDate}
              onPrevDay={() => onSelectDate(prevDate)}
              onNextDay={() => {
                if (canGoForward) onSelectDate(nextDate);
              }}
              onResetToToday={() => onSelectDate(todayStr)}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Matchup Context Banner (Visible when Daily is selected) */}
      {activeTab === 'daily' && activeChallenge && (
        <div className="relative overflow-hidden rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Start Actor */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-gold/40 bg-cinema-border shadow-md">
                {activeChallenge.startActor?.profilePath ? (
                  <img
                    src={getTmdbImageUrl(activeChallenge.startActor.profilePath)}
                    alt={activeChallenge.startActor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gold">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cinema-muted">Start Star</span>
                <h3 className="text-base font-bold text-white">{activeChallenge.startActor?.name}</h3>
              </div>
            </div>

            {/* Connecting Bridge */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold bg-gold/10 border border-gold/30 rounded-full px-2.5 py-0.5">
                Target: {activeChallenge.optimalHops || 2} Hops
              </span>
              <div className="flex items-center gap-2 text-cinema-muted">
                <div className="h-px w-8 bg-cinema-border" />
                <Footprints className="h-4 w-4 text-gold/80" />
                <div className="h-px w-8 bg-cinema-border" />
              </div>
            </div>

            {/* Target Actor */}
            <div className="flex items-center justify-end gap-3 w-full sm:w-auto text-right">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Destination</span>
                <h3 className="text-base font-bold text-white">{activeChallenge.targetActor?.name}</h3>
              </div>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-gold/40 bg-cinema-border shadow-md">
                {activeChallenge.targetActor?.profilePath ? (
                  <img
                    src={getTmdbImageUrl(activeChallenge.targetActor.profilePath)}
                    alt={activeChallenge.targetActor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gold">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Notice Banner */}
      {!isAuthenticated && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Only Registered Cinephiles Compete on the Leaderboard
              </h4>
              <p className="text-[11px] text-cinema-muted">
                Sign in or register for free to lock in your score, track your streak, and claim your place in the Hall of Fame.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 shrink-0 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-cinema-black shadow-gold-glow hover:bg-amber-400 transition"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In to Compete</span>
          </button>
        </div>
      )}

      {/* Leaderboard Podium (Top 3) */}
      {top3.length > 0 && (
        <div className="pt-2">
          {top3.length === 1 ? (
            <div className="max-w-md mx-auto">
              {renderCard1(top3[0], true)}
            </div>
          ) : top3.length === 2 ? (
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              {renderCard1(top3[0], true)}
              {renderCard2(top3[1])}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {renderCard2(top3[1])}
              {renderCard1(top3[0], false)}
              {renderCard3(top3[2])}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table (Ranks 4+) */}
      {restLeaderboard.length > 0 && (
        <div className="rounded-2xl border border-cinema-border/70 bg-cinema-card/80 overflow-hidden shadow-xl">
          <div className="border-b border-cinema-border px-5 py-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cinema-muted">
              Ranks #4 and Above
            </h4>
          </div>

          <div className="divide-y divide-cinema-border/40">
            {restLeaderboard.map((entry, idx) => {
              const rank = entry.rank || idx + 4;
              const isCurrentUser = user && (user.id === entry.userId || user.username === entry.username);

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-5 py-3.5 transition ${
                    isCurrentUser ? 'bg-gold/10 border-l-4 border-l-gold' : 'hover:bg-cinema-surface/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cinema-border bg-cinema-surface text-xs font-bold text-cinema-muted">
                      {rank}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-white">{entry.username}</span>
                      {entry.isPro && (
                        <span className="flex items-center gap-0.5 rounded bg-gold/15 px-1 py-0.2 text-[9px] font-bold text-gold border border-gold/30">
                          <Crown className="h-2.5 w-2.5" />
                          PRO
                        </span>
                      )}
                      {isCurrentUser && (
                        <span className="rounded bg-gold/20 px-1.5 py-0.2 text-[9px] font-extrabold text-gold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    {activeTab === 'daily' ? (
                      <>
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                          <Footprints className="h-3.5 w-3.5 text-gold" />
                          <span>{entry.hops} hops</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-mono text-cinema-muted">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{Math.floor((entry.durationSeconds || 0) / 60)}m {(entry.durationSeconds || 0) % 60}s</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-cinema-muted">{entry.moves || 1} games won</span>
                        <span className="text-xs font-bold text-gold">{(entry.score || 0).toLocaleString()} pts</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-2xl border border-cinema-border/60 bg-cinema-surface/40 p-8 shadow-inner">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/30 shadow-gold-glow">
            <Trophy className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {activeTab === 'daily' ? 'No Registered Scores for This Date' : 'No All-Time Records Found'}
            </h3>
            <p className="mt-1 text-xs text-cinema-muted max-w-sm mx-auto">
              {activeTab === 'daily'
                ? "No registered cinephile has completed this challenge yet. Sign in, complete the route, and claim the #1 spot!"
                : 'Play daily challenges and build up your points to claim your title in the Hall of Fame!'}
            </p>
          </div>

          {activeChallenge && (
            <button
              onClick={() => onPlayChallenge(activeDate)}
              className="mt-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-4 py-2 text-xs font-bold text-cinema-black shadow-gold-glow hover:opacity-90 transition"
            >
              <Play className="h-3.5 w-3.5 fill-cinema-black" />
              <span>Conquer This Challenge Now</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
