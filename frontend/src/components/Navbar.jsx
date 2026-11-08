import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Trophy,
  Crown,
  LogIn,
  LogOut,
  Volume2,
  VolumeX,
  User,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSoundMuted, toggleSound, subscribeSoundMuted } from '../utils/soundEffects';
import { getAvatarById, calculateCinemaLevel } from '../utils/cinemaLevels';
import { getDetailedMatchHistory } from '../api/matchHistory';

export function Navbar({
  currentView = 'game',
  onNavigateHome,
  onOpenLeaderboard,
  isLeaderboardActive = false,
  onOpenPro,
  onOpenAuth,
  onOpenProfile,
  onOpenBilling,
  isProfileActive = false
}) {
  const { user, stats, isAuthenticated, logout } = useAuth();
  const [muted, setMuted] = useState(isSoundMuted());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    return subscribeSoundMuted((newMuted) => setMuted(newMuted));
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleToggleSound = () => {
    const next = toggleSound();
    setMuted(next);
  };

  const handleLogoClick = () => {
    setMenuOpen(false);
    if (onNavigateHome) onNavigateHome();
  };

  const userAvatar = getAvatarById(user?.avatarId);
  const matchHistory = user ? getDetailedMatchHistory(user.id) : [];
  const levelInfo = user ? calculateCinemaLevel(stats, matchHistory) : null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cinema-border/70 bg-cinema-black/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer select-none text-left focus:outline-none group"
        >
          <div className="relative">
            <img
              src="/favicon.svg"
              alt="ReelQuest Logo"
              className="h-10 w-10 rounded-xl shadow-gold-glow transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-gold/20 blur-md -z-10 opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Reel<span className="text-gold">Quest</span>
          </span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleLogoClick}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition ${
              currentView === 'game'
                ? 'border border-gold bg-gold/15 text-gold shadow-gold-glow/20'
                : 'border border-cinema-border bg-cinema-surface text-slate-200 hover:border-gold/50 hover:text-gold'
            }`}
            title="Play Daily Cinema Games"
          >
            <Gamepad2 className="h-4 w-4 text-gold" />
            <span className="hidden sm:inline">Games</span>
          </button>

          <button
            type="button"
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

          <button
            type="button"
            onClick={handleToggleSound}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 transition hover:border-gold/50 hover:text-gold"
            title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {muted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-gold" />}
          </button>

          <button
            type="button"
            onClick={onOpenPro}
            className={`flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
              user?.isPro
                ? 'border border-gold/50 bg-gold/15 text-gold shadow-gold-glow hover:bg-gold/25'
                : 'bg-gradient-to-r from-gold via-amber-400 to-gold-dark text-cinema-black shadow-gold-glow hover:opacity-90'
            }`}
            title={user?.isPro ? 'Manage PRO Subscription' : 'Upgrade to ReelQuest PRO'}
          >
            <Crown className={`h-3.5 w-3.5 ${user?.isPro ? 'fill-gold text-gold' : 'fill-cinema-black text-cinema-black'}`} />
            <span className="hidden sm:inline">{user?.isPro ? 'PRO Active' : 'PRO'}</span>
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`flex h-9 items-center gap-2 rounded-xl border px-2.5 text-xs font-medium transition ${
                  isProfileActive || menuOpen
                    ? 'border-gold bg-gold/15 text-gold shadow-gold-glow'
                    : user?.isPro
                    ? 'border-gold/50 bg-cinema-surface text-slate-200 shadow-gold-glow/20 hover:border-gold'
                    : 'border-cinema-border bg-cinema-surface text-slate-200 hover:border-gold/60'
                }`}
                title="Account & Profile Menu"
                aria-expanded={menuOpen}
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
                <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[11px] font-black text-gold border border-gold/30 leading-none">
                  Lv.{levelInfo?.level || 1}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180 text-gold' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-cinema-border bg-cinema-card/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-cinema-border/60 mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white truncate">{user.username}</span>
                      {user?.isPro && (
                        <span className="rounded-full bg-gold/20 border border-gold/40 px-2 py-0.5 text-[11px] font-black text-gold leading-none">
                          PRO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                      {user.email || `Level ${levelInfo?.level || 1} Cinephile`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-cinema-surface hover:text-gold transition"
                  >
                    <User className="h-4 w-4 text-gold shrink-0" />
                    <span>My Profile &amp; Stats</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      if (onOpenBilling) onOpenBilling();
                      else onOpenProfile?.();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-cinema-surface hover:text-gold transition"
                  >
                    <CreditCard className="h-4 w-4 text-gold shrink-0" />
                    <span>PRO &amp; Saved Cards</span>
                  </button>

                  <div className="my-1.5 border-t border-cinema-border/60" />

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
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
