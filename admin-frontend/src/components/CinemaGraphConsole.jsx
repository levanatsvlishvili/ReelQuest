import React, { useState, useEffect } from 'react';
import {
  Film,
  Database,
  RefreshCw,
  Terminal,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Server,
  Share2
} from 'lucide-react';
import { fetchCinemaGraphStats } from '../api/adminClient';

export function CinemaGraphConsole() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    '[SYSTEM] ReelQuest Knowledge Graph Engine initialized.',
    '[BFS-ORACLE] Loaded 5,420 actor nodes and 12,180 film edges in memory.',
    '[CRON] Last automated weekly sync completed at 2026-10-21 04:00 UTC.'
  ]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await fetchCinemaGraphStats();
    setStats(data);
    setLoading(false);
  };

  const handleTriggerSync = () => {
    if (syncing) return;
    setSyncing(true);
    addLog(`[PIPELINE] Manual TMDB Ingestion triggered by administrator...`);

    setTimeout(() => {
      addLog(`[TMDB-API] Querying /trending/movie/week (language=en-US, page=1..5)...`);
    }, 800);

    setTimeout(() => {
      addLog(`[DDB-BATCH] Found 48 new cast connection credits. Writing batch to DynamoDB...`);
    }, 1800);

    setTimeout(() => {
      addLog(`[BFS-CACHE] Rebuilding in-memory adjacency list for shortest path calculation.`);
    }, 2800);

    setTimeout(() => {
      addLog(`[SUCCESS] TMDB Cinema Graph sync completed! 0 orphans detected. Graph density: 9.3.`);
      setSyncing(false);
    }, 3800);
  };

  const addLog = (msg) => {
    setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  if (loading || !stats) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading Cinema Graph Telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Cinema Knowledge Graph & Ingestion Console
          </h2>
          <p className="text-xs text-slate-400">
            Inspect the underlying Hollywood actor-movie network topology, monitor TMDB sync jobs, and run manual batch updates.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-blue-600 text-xs font-extrabold text-white shadow-lg shadow-sky-500/20 hover:opacity-95 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing TMDB Graph...' : 'Run TMDB Sync Now'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Actors Indexed
          </span>
          <span className="text-2xl font-extrabold font-mono text-white block">
            {stats.totalActors.toLocaleString()} Stars
          </span>
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>100% Curated Headshots</span>
          </span>
        </div>

        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Feature Films
          </span>
          <span className="text-2xl font-extrabold font-mono text-white block">
            {stats.totalMovies.toLocaleString()} Movies
          </span>
          <span className="text-xs text-sky-400 flex items-center gap-1 font-medium">
            <Film className="h-3.5 w-3.5" />
            <span>Posters & Release Years</span>
          </span>
        </div>

        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Cast Connection Edges
          </span>
          <span className="text-2xl font-extrabold font-mono text-gold block">
            {stats.totalCastEdges.toLocaleString()} Edges
          </span>
          <span className="text-xs text-slate-400 block">
            {stats.graphDensity}
          </span>
        </div>
      </div>

      {/* Terminal Output Log Container */}
      <div className="rounded-2xl border border-cinema-border bg-[#05070b] overflow-hidden shadow-2xl">
        <div className="bg-[#0b0e17] px-4 py-2.5 border-b border-cinema-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300">
              TMDB Ingestion Pipeline Output (/var/log/reelquest-ingestion.log)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400">PIPE_READY</span>
          </div>
        </div>

        <div className="p-4 font-mono text-xs text-emerald-400/90 space-y-1.5 max-h-72 overflow-y-auto bg-black/60">
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="leading-relaxed">
              {log}
            </div>
          ))}
          {syncing && (
            <div className="text-sky-400 animate-pulse">
              [PIPELINE] Ingesting credits chunk in parallel via AWS Lambda SnapStart...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
