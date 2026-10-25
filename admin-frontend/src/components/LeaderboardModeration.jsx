import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Footprints,
  User,
  Calendar,
  Sparkles,
  ShieldCheck,
  Trophy,
  Filter,
  RefreshCw
} from 'lucide-react';
import { fetchFlaggedLeaderboard, fetchRealLeaderboard, deleteFlaggedScore } from '../api/adminClient';

export function LeaderboardModeration() {
  const [flags, setFlags] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scope, setScope] = useState('all-time'); // 'all-time' | 'today'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [scope]);

  const loadAll = async () => {
    setLoading(true);
    const [flagData, lbData] = await Promise.all([
      fetchFlaggedLeaderboard(),
      fetchRealLeaderboard(scope)
    ]);
    setFlags(flagData);
    setLeaderboard(lbData);
    setLoading(false);
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Permanently remove score record for ${username}?`)) return;
    await deleteFlaggedScore(id);
    loadAll();
  };

  const handleApprove = async (id) => {
    await deleteFlaggedScore(id);
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-3 w-3" />
            <span>Real-Time Leaderboard & Anti-Cheat Audit</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Leaderboard Audit & Fair Play Moderation
          </h2>
          <p className="text-xs text-slate-400">
            Real player scores from DynamoDB. Runs with anomalous speed (&lt; 2s) or invalid hop counts are automatically flagged for administrative review.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-cinema-border/80 bg-cinema-card p-1">
            <button
              onClick={() => setScope('all-time')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                scope === 'all-time' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setScope('today')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                scope === 'today' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
          </div>

          <button
            onClick={loadAll}
            disabled={loading}
            className="p-2 rounded-xl border border-cinema-border/80 bg-cinema-card text-slate-400 hover:text-white hover:border-gold/40 transition"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* Flagged Runs Section */}
      {flags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-extrabold text-rose-400">Suspicious Runs Requiring Attention ({flags.length})</h3>
          </div>
          {flags.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-5 space-y-4 shadow-xl transition hover:border-rose-500/60"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 font-extrabold text-xs shrink-0">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-white">{item.username}</span>
                      <span className="text-[10px] font-mono text-slate-500">ID: {item.userId}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500/30 text-rose-300">
                        {item.severity}
                      </span>
                    </div>
                    <span className="text-xs text-rose-300 font-medium">
                      Flag: {item.flagReason}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="px-3.5 py-1.5 rounded-xl border border-cinema-border bg-cinema-surface text-xs font-bold text-slate-300 hover:text-white transition"
                  >
                    Dismiss (Legitimate)
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.username)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Disqualify Record</span>
                  </button>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-cinema-black/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Submitted Hops</span>
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-1 mt-0.5">
                    <Footprints className="h-3.5 w-3.5 text-gold" />
                    <span>{item.moves} moves</span>
                  </span>
                </div>

                <div className="rounded-xl bg-cinema-black/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Reported Duration</span>
                  <span className="text-sm font-bold font-mono text-rose-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-rose-400" />
                    <span>{item.durationSeconds}s</span>
                  </span>
                </div>

                <div className="rounded-xl bg-cinema-black/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Challenge Date</span>
                  <span className="text-sm font-bold font-mono text-white flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.date}</span>
                  </span>
                </div>

                <div className="rounded-xl bg-cinema-black/60 p-3">
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className="text-xs font-bold text-rose-400 block mt-0.5">
                    Flagged by Heuristics
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clean Audit Banner */}
      {flags.length === 0 && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">All Submissions Verified Clean</h3>
              <p className="text-xs text-slate-400">
                0 suspicious runs detected. All recorded completions satisfy speed and graph topological constraints.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Audit Clean
          </span>
        </div>
      )}

      {/* Real Leaderboard Table */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card overflow-hidden shadow-xl">
        <div className="p-4 border-b border-cinema-border/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold" />
            <h3 className="text-sm font-extrabold text-white">
              Live Verified Submissions ({scope === 'all-time' ? 'All-Time High Scores' : "Today's Puzzles"})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Total Records: {leaderboard.length}
          </span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No submissions recorded yet for this view in this environment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0e17] text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-cinema-border/50">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Player / User ID</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Hops / Moves</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cinema-border/40">
                {leaderboard.map((entry, index) => (
                  <tr key={`${entry.userId}-${index}`} className="hover:bg-cinema-surface/50 transition">
                    <td className="px-4 py-3 font-mono font-extrabold text-gold">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-white">{entry.username || 'Anonymous'}</span>
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[200px]">{entry.userId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {entry.score?.toLocaleString() || 0} pts
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {entry.moves || '-'} moves
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {entry.durationSeconds ? `${entry.durationSeconds}s` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        entry.isPro
                          ? 'bg-gold/20 text-gold border border-gold/40'
                          : 'bg-slate-700/40 text-slate-400'
                      }`}>
                        {entry.isPro ? 'PRO' : 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[10px]">
                      {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
