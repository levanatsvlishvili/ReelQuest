import React, { useState, useEffect } from 'react';
import {
  Users,
  Trophy,
  Swords,
  DollarSign,
  Activity,
  Flame,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  Radio,
  Film
} from 'lucide-react';
import { fetchDashboardMetrics } from '../api/adminClient';

export function DashboardOverview({ onNavigateTab }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    const data = await fetchDashboardMetrics();
    setMetrics(data);
    setLoading(false);
  };

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Activity className="h-6 w-6 animate-spin text-gold" />
          <span className="text-xs font-bold uppercase tracking-wider">Retrieving Real Cloud Telemetry...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Leaderboard Players',
      value: metrics.totalPlayers,
      unit: 'registered cinephiles',
      icon: Users,
      color: 'text-sky-400',
      border: 'border-sky-500/20 bg-sky-500/5',
      trend: 'Live from DynamoDB'
    },
    {
      title: "Today's Puzzle Solvers",
      value: metrics.todayCompletions,
      unit: 'completed runs today',
      icon: Trophy,
      color: 'text-gold',
      border: 'border-gold/30 bg-gold/5',
      trend: metrics.todayChallenge ? `${metrics.todayChallenge.startActor?.name || 'Actor'} ➔ ${metrics.todayChallenge.targetActor?.name || 'Actor'}` : 'Daily Challenge'
    },
    {
      title: 'Active PRO Members',
      value: metrics.proSubscribers,
      unit: 'VIP Cinephile accounts',
      icon: DollarSign,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20 bg-emerald-500/5',
      trend: 'Cognito Verified'
    },
    {
      title: 'Live Backend Health',
      value: metrics.dbHealth,
      unit: 'HTTP API Gateway & Java 21',
      icon: Radio,
      color: 'text-amber-400',
      border: 'border-amber-500/20 bg-amber-500/5',
      trend: 'SnapStart Active'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-[#12151e] to-cinema-card p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gold/15 border border-gold/30 text-gold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Telemetry: Live Connected</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Central Administrative Control Bridge
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Live telemetry, real player scores, daily star puzzles, and serverless AWS health status for ReelQuest.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateTab('scheduler')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition"
          >
            <span>View Daily Challenge</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl border p-5 space-y-3 transition hover:border-gold/50 ${kpi.border}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl bg-cinema-black/60 ${kpi.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight font-mono block">
                  {kpi.value}
                </span>
                <span className="text-xs text-slate-400 font-medium truncate block">
                  {kpi.unit}
                </span>
              </div>

              <div className="pt-2 border-t border-cinema-border/50 text-[10px] font-bold text-slate-400 flex items-center justify-between">
                <span className="truncate">{kpi.trend}</span>
                <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Activity & Cloud Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-cinema-border/80 bg-cinema-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-white">Live Platform Activity Feed</h3>
              <p className="text-xs text-slate-400">Real-time audit log of actual verified player submissions</p>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Cloud</span>
            </span>
          </div>

          <div className="divide-y divide-cinema-border/50">
            {metrics.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No player submissions recorded yet today in this environment.
              </div>
            ) : (
              metrics.recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold shrink-0 bg-gold/20 text-gold border border-gold/30">
                      {act.type}
                    </span>
                    <p className="text-slate-200 truncate">{act.text}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Health Card (1 Col) */}
        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white">Infrastructure Status</h3>
            <p className="text-xs text-slate-400">AWS Cloud Telemetry</p>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/80 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">API Gateway & DynamoDB</span>
                <span className="font-mono font-bold text-emerald-400">{metrics.dbHealth}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[100%]" />
              </div>
            </div>

            <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/80 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Today's Star Puzzle</span>
                <span className="font-mono font-bold text-gold">
                  {metrics.todayChallenge ? `${metrics.todayChallenge.optimalDegrees} Hops` : 'Active'}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gold h-full rounded-full w-[100%]" />
              </div>
            </div>

            <div className="rounded-xl border border-cinema-border/60 bg-cinema-surface/80 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cognito User Pool</span>
                <span className="font-mono font-bold text-sky-400">Secured (JWT)</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full w-[100%]" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('moderation')}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:border-gold/40 transition"
          >
            <Shield className="h-3.5 w-3.5 text-gold" />
            <span>Open Leaderboard & Moderation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
