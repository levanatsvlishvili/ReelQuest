import React, { useState, useEffect } from 'react';
import { Menu, RefreshCw, Clock, ShieldCheck, Database } from 'lucide-react';

export function Header({ currentTab, onOpenMobile, onRefresh }) {
  const [utcTime, setUtcTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const titles = {
    overview: 'Executive Overview & Live Telemetry',
    scheduler: 'Daily Challenge Scheduler & BFS Engine',
    users: 'User Directory & PRO Subscription CRM',
    moderation: 'Leaderboard Audit & Anti-Cheat Moderation',
    graph: 'Cinema Knowledge Graph & Ingestion Console',
    system: 'AWS Serverless Infrastructure & Health'
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080a0f]/90 backdrop-blur-md border-b border-cinema-border/80 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-cinema-surface lg:hidden transition"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold block">
            Portal / {currentTab}
          </span>
          <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
            {titles[currentTab] || 'Admin Portal'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* UTC Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/60 text-[11px] text-slate-400 font-mono">
          <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
          <span>{utcTime || 'UTC Live'}</span>
        </div>

        {/* AWS Region Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/60 text-[11px] text-slate-300">
          <Database className="h-3.5 w-3.5 text-sky-400 shrink-0" />
          <span>eu-central-1 (DDB Live)</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefreshClick}
          title="Refresh Data"
          className="p-2 rounded-xl border border-cinema-border/80 bg-cinema-surface text-slate-300 hover:text-gold hover:border-gold/40 transition active:scale-95"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-gold' : ''}`} />
        </button>
      </div>
    </header>
  );
}
