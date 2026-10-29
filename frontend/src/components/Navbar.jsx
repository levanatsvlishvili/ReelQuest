import React, { useState, useEffect } from 'react';
import { Film, Trophy, Flame, Crown, LogIn, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSoundMuted, toggleSound, subscribeSoundMuted } from '../utils/soundEffects';
import { getAvatarById, calculateCinemaLevel } from '../utils/cinemaLevels';
import { getDetailedMatchHistory } from '../api/matchHistory';

export function Navbar({
  onOpenLeaderboard,
  isLeaderboardActive = false,
  onOpenPro,
  onOpenAuth,
  onOpenProfile,
  isProfileActive = false
}) {
  const { user, stats, isAuthenticated, logout } = useAuth();
  const [muted, setMuted] = useState(isSoundMuted());

  useEffect(() => {
    return subscribeSoundMuted((newMuted) => setMuted(newMuted));
  }, []);

  const handleToggleSound = () => {
    const next = toggleSound();
    setMuted(next);
  };

  const currentStreak = stats?.streak ?? 0;
  const userAvatar = getAvatarById(user?.avatarId);
  const matchHistory = user ? getDetailedMatchHistory(user.id) : [];
  const levelInfo = user ? calculateCinemaLevel(stats, matchHistory) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cinema-border/70 bg-cinema-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.location.reload()}>
          <div className="relative group">
            <img
              src="/favicon.svg"
              alt="ReelQuest Logo"
              className="h-10 w-10 rounded-xl shadow-gold-glow transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-gold/20 blur-md -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Reel<span className="text-gold">Quest</span>
              </span>
              <span className="rounded-full bg-cinema-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cinema-muted">
                Beta
              </span>
            </div>
            <p className="text-[11px] text-cinema-muted hidden sm:block">
              The Hollywood Cinema Oracle • Beat Otara
            </p>
          </div>
        </div>

        {/* Right Controls: Unified h-9 height for pixel-perfect alignment */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isAuthenticated && (
            <div className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 text-xs font-semibold text-orange-400">
              <Flame className="h-4 w-4 fill-orange-400/20" />
              <span>{currentStreak} Day Streak</span>
            </div>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
              isLeaderboardActive
                ? 'border border-gold bg-gold/15 text-gold shadow-gold-glow/20'
                : 'border border-cinema-border bg-cinema-surface text-slate-200 hover:border-gold/50 hover:text-gold'
            }`}
          >
            <Trophy className="h-4 w-4 text-gold" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 transition hover:border-gold/50 hover:text-gold"
            title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-gold" />}
          </button>

          {/* PRO Button */}
          <button
            onClick={onOpenPro}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
              user?.isPro
                ? 'border border-gold/40 bg-gold/15 text-gold shadow-gold-glow hover:bg-gold/25'
                : 'bg-gradient-to-r from-gold via-amber-400 to-gold-dark text-cinema-black shadow-gold-glow hover:opacity-90'
            }`}
          >
            <Crown className={`h-3.5 w-3.5 ${user?.isPro ? 'fill-gold text-gold' : 'fill-cinema-black text-cinema-black'}`} />
            <span className="hidden sm:inline">{user?.isPro ? 'PRO Active' : 'PRO'}</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* Profile Button: uniform h-9 with custom photo / avatar and level badge */}
              <button
                onClick={onOpenProfile}
                className={`flex h-9 items-center gap-2 rounded-xl border px-2.5 text-xs font-medium transition ${
                  isProfileActive
                    ? 'border-gold bg-gold/20 text-gold shadow-gold-glow'
                    : user?.isPro
                    ? 'border-gold/50 bg-cinema-surface text-slate-200 shadow-gold-glow/20 hover:border-gold'
                    : 'border-cinema-border bg-cinema-surface text-slate-200 hover:border-gold/60'
                }`}
                title="View Cinephile Profile"
              >
                {user?.customAvatarUrl ? (
                  <img
                    src={user.customAvatarUrl}
                    alt={user.username}
                    className="h-6 w-6 rounded-lg object-cover border border-gold/40 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-cinema-border/70 text-xs shadow-inner">
                    {userAvatar.emoji}
                  </div>
                )}
                <span className="max-w-[75px] sm:max-w-[110px] truncate font-bold text-white text-xs leading-none">
                  {user.username}
                </span>
                <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-black text-gold border border-gold/30 leading-none">
                  Lv.{levelInfo?.level || 1}
                </span>
                {user.isPro && (
                  <span className="hidden sm:inline text-[9px] text-amber-400 font-black leading-none">
                    PRO
                  </span>
                )}
              </button>

              {/* Log Out Button */}
              <button
                onClick={logout}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface/80 px-3 text-xs font-semibold text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Log Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3.5 text-xs font-medium text-slate-200 transition hover:border-cinema-muted hover:text-white"
            >
              <LogIn className="h-4 w-4 text-cinema-muted" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
