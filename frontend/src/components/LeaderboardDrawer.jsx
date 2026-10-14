import { useState, useEffect } from 'react';
import { Trophy, Crown, X, Clock, Footprints, RefreshCw, Calendar, Flame, Medal } from 'lucide-react';
import { fetchLeaderboard } from '../api/client';

export function LeaderboardDrawer({ isOpen, onClose, challengeId }) {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'all-time'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData(activeTab);
    }
  }, [isOpen, challengeId, activeTab]);

  async function loadData(tab = activeTab) {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(challengeId, tab);
      setLeaderboard(data);
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-md flex-col border-l border-cinema-border bg-cinema-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinema-border p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <h3 className="text-base font-bold text-white tracking-wide">Leaderboard</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(activeTab)}
              disabled={loading}
              className="rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-surface hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-surface hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2.5 gap-1.5 border-b border-cinema-border/60 bg-cinema-bg/40">
          <button
            onClick={() => handleTabChange('daily')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'daily'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-sm'
                : 'text-cinema-muted hover:text-slate-200 hover:bg-cinema-surface/60 border border-transparent'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Daily Challenge</span>
          </button>
          <button
            onClick={() => handleTabChange('all-time')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeTab === 'all-time'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-sm'
                : 'text-cinema-muted hover:text-slate-200 hover:bg-cinema-surface/60 border border-transparent'
            }`}
          >
            <Medal className="h-3.5 w-3.5" />
            <span>All-Time Legends</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {leaderboard.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : rank === 2
                ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                : rank === 3
                ? 'bg-amber-700/20 text-amber-600 border-amber-700/40'
                : 'bg-cinema-surface text-cinema-muted border-cinema-border';

            const minutes = Math.floor((entry.durationSeconds || 0) / 60);
            const seconds = (entry.durationSeconds || 0) % 60;
            const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-cinema-border bg-cinema-surface p-3 transition hover:border-gold/40"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-bold ${rankBadgeColor}`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{entry.username}</span>
                      {entry.isPro && (
                        <span className="flex items-center gap-0.5 rounded bg-gold/15 px-1 py-0.2 text-[9px] font-bold text-gold border border-gold/30">
                          <Crown className="h-2.5 w-2.5" />
                          PRO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-cinema-muted">
                      {activeTab === 'daily' ? `Rank #${rank}` : `${entry.moves || 1} ${entry.moves === 1 ? 'game' : 'games'} won`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {activeTab === 'daily' ? (
                    <>
                      <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                        <Footprints className="h-3.5 w-3.5 text-gold" />
                        <span>{entry.hops} hops</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-cinema-muted">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeStr}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs font-bold text-gold">
                        <Flame className="h-3.5 w-3.5" />
                        <span>{(entry.score || 0).toLocaleString()} pts</span>
                      </div>
                      <span className="text-[10px] text-cinema-muted">Total Score</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 px-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/30 shadow-gold-glow">
                <Trophy className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">
                {activeTab === 'daily' ? 'No Scores Recorded Today' : 'No All-Time Scores Yet'}
              </h4>
              <p className="text-xs text-cinema-muted max-w-xs">
                {activeTab === 'daily'
                  ? "Be the first cinephile to complete today's challenge and claim the #1 spot on the leaderboard!"
                  : 'Play and conquer daily challenges to earn points and secure your spot in the Hall of Fame!'}
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-cinema-border p-4 text-center">
          <p className="text-[11px] text-cinema-muted">
            {activeTab === 'daily'
              ? 'Daily rankings: sorted by fewest hops, then fastest completion speed.'
              : 'All-time legends: ranked by total accumulated score across all victories.'}
          </p>
        </div>
      </div>
    </div>
  );
}
