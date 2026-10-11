import { useState, useEffect } from 'react';
import { Trophy, Crown, X, Clock, Footprints, RefreshCw } from 'lucide-react';
import { fetchLeaderboard } from '../api/client';

export function LeaderboardDrawer({ isOpen, onClose, challengeId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && challengeId) {
      loadData();
    }
  }, [isOpen, challengeId]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchLeaderboard(challengeId);
      setLeaderboard(data);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="flex h-full w-full max-w-md flex-col border-l border-cinema-border bg-cinema-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinema-border p-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <h3 className="text-base font-bold text-white">Daily Leaderboard</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {leaderboard.map((entry, index) => {
            const rank = entry.rank || index + 1;
            const isTop3 = rank <= 3;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : rank === 2
                ? 'bg-slate-300/20 text-slate-200 border-slate-300/40'
                : rank === 3
                ? 'bg-amber-700/20 text-amber-600 border-amber-700/40'
                : 'bg-cinema-surface text-cinema-muted border-cinema-border';

            const minutes = Math.floor(entry.durationSeconds / 60);
            const seconds = entry.durationSeconds % 60;
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
                    {rank}
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
                    <span className="text-[10px] text-cinema-muted">Rank #{rank}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-200">
                    <Footprints className="h-3.5 w-3.5 text-gold" />
                    <span>{entry.hops} hops</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono text-cinema-muted">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && !loading && (
            <div className="py-12 text-center text-xs text-cinema-muted">
              No entries recorded yet today. Be the first to finish!
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-cinema-border p-4 text-center">
          <p className="text-[11px] text-cinema-muted">
            Scores ranked by fewest hops, then by completion speed.
          </p>
        </div>
      </div>
    </div>
  );
}
