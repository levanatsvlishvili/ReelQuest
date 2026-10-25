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
  ShieldCheck
} from 'lucide-react';
import { fetchFlaggedLeaderboard, deleteFlaggedScore } from '../api/adminClient';

export function LeaderboardModeration() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    setLoading(true);
    const data = await fetchFlaggedLeaderboard();
    setFlags(data);
    setLoading(false);
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Permanently remove high score record for ${username} from the public leaderboard?`)) return;
    await deleteFlaggedScore(id);
    loadFlags();
  };

  const handleApprove = async (id) => {
    await deleteFlaggedScore(id);
    loadFlags();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 border border-rose-500/30 text-rose-400 uppercase tracking-wider mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span>Anti-Cheat Heuristics Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Leaderboard Audit & Fair Play Moderation
          </h2>
          <p className="text-xs text-slate-400">
            Automatically surfaces suspicious runs with impossible speed (&lt; 2s) or path anomalies for administrative verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Pending Review: <strong className="text-rose-400 font-mono">{flags.length}</strong>
          </span>
        </div>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-extrabold text-white">All Leaderboards Verified Clean</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No suspicious completion speeds or graph anomalies detected across today&apos;s submissions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                    <span>{item.hops} hops</span>
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
                  <span className="text-xs font-bold text-amber-400 block mt-0.5">
                    Action Required
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
