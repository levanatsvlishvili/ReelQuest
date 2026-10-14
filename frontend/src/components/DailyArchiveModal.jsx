import React, { useState, useEffect } from 'react';
import { X, Calendar, Search, CheckCircle2, Play, ChevronRight, History } from 'lucide-react';
import { fetchDailyChallenge } from '../api/client';

export function DailyArchiveModal({ isOpen, onClose, currentDate, onSelectDate }) {
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customDateInput, setCustomDateInput] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    async function loadRecent() {
      const datesToLoad = [];
      const today = new Date();
      // Load last 14 days
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        datesToLoad.push(d.toISOString().slice(0, 10));
      }

      try {
        const results = await Promise.all(
          datesToLoad.map(async (dStr) => {
            try {
              const res = await fetchDailyChallenge(dStr);
              return res;
            } catch {
              return null;
            }
          })
        );

        if (isMounted) {
          setRecentChallenges(results.filter(Boolean));
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load archive challenges:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadRecent();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customDateInput) return;
    if (customDateInput > todayStr) {
      alert("You cannot play future challenges! Please select today or a past date.");
      return;
    }
    onSelectDate(customDateInput);
    onClose();
  };

  const getSavedGameStatus = (dateStr) => {
    const sessionKey = `reelquest_session_daily-${dateStr}`;
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed.gameStatus;
    } catch {
      return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-cinema-border/80 bg-cinema-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cinema-border/60 px-6 py-4 bg-cinema-surface/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold border border-gold/30">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Challenge Archive
                <span className="rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold">
                  Unlimited
                </span>
              </h2>
              <p className="text-xs text-cinema-muted">
                Play any past Six Degrees Hollywood challenge anytime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-cinema-surface hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Custom Date Jump Bar */}
        <div className="px-6 py-3.5 bg-cinema-black/40 border-b border-cinema-border/40">
          <form onSubmit={handleCustomDateSubmit} className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cinema-muted" />
              <input
                type="date"
                max={todayStr}
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="w-full rounded-lg border border-cinema-border/80 bg-cinema-surface/80 py-2 pl-9 pr-3 text-xs text-white placeholder-cinema-muted focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/30"
                placeholder="Jump to any historical date (YYYY-MM-DD)"
              />
            </div>
            <button
              type="submit"
              disabled={!customDateInput}
              className="rounded-lg bg-gold/20 border border-gold/40 px-3.5 py-2 text-xs font-semibold text-gold hover:bg-gold/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Play Date
            </button>
          </form>
        </div>

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
              <p className="mt-3 text-xs text-cinema-muted">Loading cinema challenge archives...</p>
            </div>
          ) : recentChallenges.length === 0 ? (
            <div className="py-12 text-center text-cinema-muted text-xs">
              No archive challenges found.
            </div>
          ) : (
            recentChallenges.map((item) => {
              const isSelected = item.date === currentDate;
              const isToday = item.date === todayStr;
              const savedStatus = getSavedGameStatus(item.date);
              const isWon = savedStatus === 'WON';

              return (
                <div
                  key={item.date}
                  onClick={() => {
                    onSelectDate(item.date);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-gold/60 bg-gold/10 shadow-gold-glow/20'
                      : 'border-cinema-border/70 bg-cinema-surface/40 hover:border-gold/40 hover:bg-cinema-surface/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center min-w-[58px] rounded-lg bg-cinema-black/60 border border-cinema-border/50 py-1.5 px-2 text-center">
                      <span className="text-[10px] font-medium text-cinema-muted uppercase">
                        {new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-base font-extrabold text-white leading-tight">
                        {new Date(item.date + 'T00:00:00').getDate()}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold text-gold uppercase mt-0.5">
                          Today
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                        <span className="text-white">{item.startActor?.name || 'Actor'}</span>
                        <span className="text-cinema-muted">➔</span>
                        <span className="text-gold">{item.targetActor?.name || 'Actor'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-cinema-muted">
                        <span>Optimal: ~{item.optimalHops} hops</span>
                        <span>•</span>
                        <span>Date: {item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isWon && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Solved</span>
                      </span>
                    )}

                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                      isSelected
                        ? 'border-gold bg-gold text-cinema-black'
                        : 'border-cinema-border bg-cinema-surface text-slate-300 group-hover:border-gold group-hover:text-gold'
                    }`}>
                      {isSelected ? (
                        <span className="text-[10px] font-bold">ACTIVE</span>
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-cinema-border/60 px-6 py-3 bg-cinema-surface/40 flex items-center justify-between text-xs text-cinema-muted">
          <span>Total archive challenges: unlimited</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-cinema-border px-3 py-1 text-slate-300 hover:text-white hover:bg-cinema-surface transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
