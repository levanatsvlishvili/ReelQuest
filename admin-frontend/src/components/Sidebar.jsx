import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  History,
  ShieldAlert,
  Film,
  Server,
  LogOut,
  ExternalLink,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function Sidebar({ currentTab, onSelectTab, mobileOpen, onCloseMobile }) {
  const { adminUser, logout } = useAdminAuth();

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDev = hostname.includes('dev') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const envLabel = isLocal ? 'LOCAL' : (isDev ? 'DEV' : 'PROD');
  const envBadgeColor = isDev
    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';

  const playerAppUrl = isLocal
    ? 'http://localhost:5173'
    : (isDev ? 'https://dev.reelquest.io' : 'https://reelquest.io');

  const navItems = [
    {
      id: 'overview',
      label: 'Overview & KPIs',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'scheduler',
      label: 'Daily Challenge Scheduler',
      icon: Calendar,
      badge: null
    },
    {
      id: 'history',
      label: 'Game Match History',
      icon: History,
      badge: 'Audit'
    },
    {
      id: 'users',
      label: 'User CRM & Pro Tier',
      icon: Users,
      badge: null
    },
    {
      id: 'moderation',
      label: 'Leaderboard & Anti-Cheat',
      icon: ShieldAlert,
      badge: null
    },
    {
      id: 'graph',
      label: 'Cinema Graph & TMDB',
      icon: Film,
      badge: null
    },
    {
      id: 'system',
      label: 'AWS & Cloud System',
      icon: Server,
      badge: null
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090c13] border-r border-cinema-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-6 border-b border-cinema-border/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 border border-gold/40 text-gold shadow-gold-glow">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold block">
                Control Hub
              </span>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                ReelQuest Adminka
              </h2>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${envBadgeColor}`}>
            {envLabel}
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 py-1.5 block">
            Administrative Modules
          </span>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition group ${
                  isActive
                    ? 'bg-gold/15 text-gold border border-gold/40 shadow-gold-glow'
                    : 'text-slate-400 hover:text-white hover:bg-cinema-surface border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition ${
                      isActive ? 'text-gold' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                        item.badge.includes('Flags')
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : 'bg-gold/20 text-gold'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-gold" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile & External Links */}
        <div className="p-4 border-t border-cinema-border/70 space-y-3 bg-[#06080d]">
          {/* Quick link to live game player frontend */}
          <a
            href={playerAppUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-cinema-border/80 bg-cinema-surface/60 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-gold/40 transition"
          >
            <span className="flex items-center gap-2">
              <Film className="h-3.5 w-3.5 text-gold" />
              <span>Open ReelQuest Game</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
          </a>

          {/* Admin User Card */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-gold/20 border border-gold/40 text-gold flex items-center justify-center font-extrabold text-xs shrink-0">
                {adminUser?.username ? adminUser.username.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {adminUser?.username || 'Administrator'}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {adminUser?.email || 'admin@reelquest.io'}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
