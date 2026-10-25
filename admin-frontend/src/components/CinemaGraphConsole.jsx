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
  Share2,
  Clock,
  Compass
} from 'lucide-react';
import { fetchCinemaGraphStats, computeShortestPath } from '../api/adminClient';

export function CinemaGraphConsole() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real BFS Path Tester State
  const [startActorId, setStartActorId] = useState('6384'); // Keanu Reeves
  const [targetActorId, setTargetActorId] = useState('1892'); // Matt Damon
  const [testingPath, setTestingPath] = useState(false);
  const [pathResult, setPathResult] = useState(null);
  const [pathError, setPathError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await fetchCinemaGraphStats();
    setStats(data);
    setLoading(false);
  };

  const handleTestBfs = async (e) => {
    e?.preventDefault();
    if (!startActorId.trim() || !targetActorId.trim()) return;

    setTestingPath(true);
    setPathResult(null);
    setPathError(null);

    try {
      const result = await computeShortestPath(startActorId.trim(), targetActorId.trim());
      setPathResult(result);
    } catch (err) {
      setPathError(err.message || 'BFS search failed to compute path.');
    } finally {
      setTestingPath(false);
    }
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
            Cinema Knowledge Graph & BFS Oracle Console
          </h2>
          <p className="text-xs text-slate-400">
            Real bidirectional Breadth-First Search (BFS) engine executed on Java 21 AWS Lambda directly querying DynamoDB graph edges.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cinema-border/80 bg-cinema-card text-xs font-extrabold text-slate-300 hover:text-white hover:border-gold/40 transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-gold' : ''}`} />
          <span>Refresh Graph Status</span>
        </button>
      </div>

      {/* Real Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            DynamoDB Graph Items
          </span>
          <span className="text-2xl font-extrabold font-mono text-white block">
            {stats.totalEntities}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Actors, movies, and cast credit edges
          </span>
        </div>

        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Graph Traversal Engine
          </span>
          <span className="text-sm font-extrabold text-gold block">
            {stats.engine}
          </span>
          <span className="text-[10px] text-emerald-400 block flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Optimal shortest hops guaranteed</span>
          </span>
        </div>

        <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            AWS Hosting Region
          </span>
          <span className="text-base font-extrabold text-white block">
            {stats.region}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {stats.storage}
          </span>
        </div>
      </div>

      {/* Live BFS Path Tester */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-gold" />
            <div>
              <h3 className="text-sm font-extrabold text-white">Live Graph Shortest-Path Tracer</h3>
              <p className="text-xs text-slate-400">Test live bidirectional BFS path calculation between any two TMDB actor IDs</p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Real Backend Query (/shortest-path)
          </span>
        </div>

        <form onSubmit={handleTestBfs} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Start Actor TMDB ID
            </label>
            <input
              type="text"
              value={startActorId}
              onChange={(e) => setStartActorId(e.target.value)}
              placeholder="e.g. 6384 (Keanu Reeves)"
              className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Actor TMDB ID
            </label>
            <input
              type="text"
              value={targetActorId}
              onChange={(e) => setTargetActorId(e.target.value)}
              placeholder="e.g. 1892 (Matt Damon)"
              className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs text-white font-mono focus:border-gold focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={testingPath}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 py-2.5 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition disabled:opacity-50"
            >
              <Play className={`h-3.5 w-3.5 fill-cinema-black ${testingPath ? 'animate-spin' : ''}`} />
              <span>{testingPath ? 'Calculating BFS...' : 'Trace Shortest Path'}</span>
            </button>
          </div>
        </form>

        {pathError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{pathError}</span>
          </div>
        )}

        {pathResult && (
          <div className="rounded-xl border border-cinema-border/70 bg-[#07090e] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cinema-border/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Calculated Shortest Degrees:</span>
                <strong className="text-gold font-mono text-sm">{pathResult.degrees} Hops</strong>
              </div>
              <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                <span>Explored Nodes: <strong className="text-white">{pathResult.exploredNodesCount}</strong></span>
                <span>Latency: <strong className="text-emerald-400">{pathResult.executionTimeMs} ms</strong></span>
              </div>
            </div>

            {/* Path Steps */}
            {pathResult.path && pathResult.path.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Topological Path Hops:
                </span>
                <div className="space-y-2">
                  {pathResult.path.map((step, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-cinema-surface/60 border border-cinema-border/40 text-xs">
                      <span className="font-extrabold text-gold">{step.fromActorName}</span>
                      <span className="text-slate-500 text-[10px]">starred in</span>
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                        {step.movieTitle}
                      </span>
                      <span className="text-slate-500 text-[10px]">with</span>
                      <span className="font-extrabold text-gold">{step.toActorName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Direct connection or 0 intermediate degrees.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
