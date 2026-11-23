import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  LogIn,
  LogOut,
  Volume2,
  VolumeX,
  User,
  CreditCard,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSoundMuted, toggleSound, subscribeSoundMuted } from '../utils/soundEffects';
import { getAvatarById, calculateCinemaLevel } from '../utils/cinemaLevels';
import { getDetailedMatchHistory } from '../api/matchHistory';
import {
  DAILY_GAMES,
  getDailyGamesStatus,
  subscribeDailyProgress
} from '../utils/dailyProgress';

function isModifiedClick(e) {
  return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
}

export function Navbar({
  currentView = 'hub',
  activeMode = 'six-degrees',
  onNavigateHome,
  onSelectGame,
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
  const [dailyStatus, setDailyStatus] = useState(() => getDailyGamesStatus(user?.id));
  const menuRef = useRef(null);

  useEffect(() => {
    return subscribeSoundMuted((newMuted) => setMuted(newMuted));
  }, []);

  useEffect(() => {
    setDailyStatus(getDailyGamesStatus(user?.id));
    return subscribeDailyProgress(() => {
      setDailyStatus(getDailyGamesStatus(user?.id));
    });
  }, [user?.id]);

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
    onNavigateHome?.();
  };

  const userAvatar = getAvatarById(user?.avatarId);
  const matchHistory = user ? getDetailedMatchHistory(user.id) : [];
  const levelInfo = user ? calculateCinemaLevel(stats, matchHistory) : null;

  const isGameItemActive = (gameId) => {
    if (currentView !== 'game') return false;
    if (gameId === 'six-degrees' && activeMode === 'custom-path') return true;
    return activeMode === gameId;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.07] bg-cinema-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 sm:h-[60px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          onClick={(e) => {
            if (isModifiedClick(e)) return;
            e.preventDefault();
            handleLogoClick();
          }}
          className="flex items-center gap-2.5 cursor-pointer select-none text-left focus:outline-none group shrink-0"
          title="Today's Cinema Reel"
        >
          <img
            src="/favicon.svg"
            alt="ReelQuest Logo"
            className="h-8 w-8 rounded-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-lg font-extrabold tracking-tight text-white">
            Reel<span className="text-gold">Quest</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Daily Games">
          <a
            href="/"
            onClick={(e) => {
              if (isModifiedClick(e)) return;
              e.preventDefault();
              handleLogoClick();
            }}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
              currentView === 'hub'
                ? 'bg-white/[0.06] text-white'
                : 'text-cinema-muted hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Today</span>
            {currentView === 'hub' && (
              <span className="absolute -bottom-[14px] left-3 right-3 h-[2px] rounded-full bg-gold" />
            )}
          </a>

          {DAILY_GAMES.map((game) => {
            const active = isGameItemActive(game.id);
            const done = Boolean(dailyStatus[game.id]?.done);
            return (
              <a
                key={game.id}
                href={game.path}
                onClick={(e) => {
                  if (isModifiedClick(e)) return;
                  e.preventDefault();
                  onSelectGame?.(game.id);
                }}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-white/[0.06] text-white'
                    : 'text-cinema-muted hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    done ? 'bg-emerald-400' : 'border border-slate-500'
                  }`}
                  title={done ? 'Completed today' : 'Not played yet today'}
                />
                <span>{game.shortName}</span>
                {active && (
                  <span className="absolute -bottom-[14px] left-3 right-3 h-[2px] rounded-full bg-gold" />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/leaderboard"
            onClick={(e) => {
              if (isModifiedClick(e)) return;
              e.preventDefault();
              onOpenLeaderboard?.();
            }}
            className={`flex h-8 sm:h-9 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition border ${
              isLeaderboardActive
                ? 'border-gold/50 bg-gold/10 text-gold'
                : 'border-white/[0.08] bg-transparent text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 text-gold" />
            <span className="hidden sm:inline">Leaderboard</span>
          </a>

          {!user?.isPro && (
            <button
              type="button"
              onClick={onOpenPro}
              className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg bg-gold px-2.5 sm:px-3 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition active:scale-95"
              title="Upgrade to ReelQuest PRO"
            >
              <Crown className="h-3.5 w-3.5 fill-cinema-black text-cinema-black" />
              <span className="hidden sm:inline">PRO</span>
            </button>
          )}

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={`flex h-8 sm:h-9 items-center gap-2 rounded-full border pl-1.5 pr-2.5 text-xs font-semibold transition ${
                  isProfileActive || menuOpen
                    ? 'border-gold/60 bg-gold/10 text-white'
                    : 'border-white/[0.1] bg-cinema-surface text-slate-200 hover:border-white/25'
                }`}
                title="Account & Profile Menu"
                aria-expanded={menuOpen}
              >
                {user?.customAvatarUrl ? (
                  <img
                    src={user.customAvatarUrl}
                    alt={user.username}
                    className="h-6 w-6 rounded-full object-cover border border-white/15 shrink-0"
                  />
                ) : (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cinema-card text-xs">
                    {userAvatar.emoji}
                  </div>
                )}
                <span className="max-w-[75px] sm:max-w-[100px] truncate font-bold text-white leading-none">
                  {user.username}
                </span>
                {user?.isPro && (
                  <Crown className="h-3 w-3 fill-gold text-gold shrink-0" />
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180 text-gold' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-cinema-card/98 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-white/[0.07] mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white truncate">{user.username}</span>
                      <span className="text-[11px] font-bold text-gold">Lv.{levelInfo?.level || 1}</span>
                    </div>
                    <span className="text-[11px] text-cinema-muted block truncate mt-0.5">
                      {user.email || 'ReelQuest Cinephile'}
                    </span>
                  </div>

                  <a
                    href="/profile"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setMenuOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06] hover:text-white transition"
                  >
                    <User className="h-4 w-4 text-gold shrink-0" />
                    <span>My Profile &amp; Stats</span>
                  </a>

                  <a
                    href="/billing"
                    onClick={(e) => {
                      if (isModifiedClick(e)) return;
                      e.preventDefault();
                      setMenuOpen(false);
                      if (onOpenBilling) onOpenBilling();
                      else onOpenProfile?.();
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06] hover:text-white transition"
                  >
                    <CreditCard className="h-4 w-4 text-gold shrink-0" />
                    <span>{user?.isPro ? 'PRO Active & Billing' : 'Upgrade to PRO'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/[0.06] hover:text-white transition"
                  >
                    <span className="flex items-center gap-2.5">
                      {muted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-gold" />}
                      <span>Sound Effects</span>
                    </span>
                    <span className="text-[11px] text-cinema-muted">{muted ? 'Off' : 'On'}</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.07]" />

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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleSound}
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:text-white transition"
                title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-gold" />}
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-cinema-surface px-3 text-xs font-semibold text-slate-100 transition hover:border-white/30 hover:text-white"
              >
                <LogIn className="h-3.5 w-3.5 text-cinema-muted" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden border-t border-white/[0.05] overflow-x-auto scrollbar-none">
        <div className="mx-auto flex items-center gap-1 px-4 py-1.5 min-w-max">
          <a
            href="/"
            onClick={(e) => {
              if (isModifiedClick(e)) return;
              e.preventDefault();
              handleLogoClick();
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              currentView === 'hub'
                ? 'bg-white/[0.08] text-white'
                : 'text-cinema-muted hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Today</span>
          </a>
          {DAILY_GAMES.map((game) => {
            const active = isGameItemActive(game.id);
            const done = Boolean(dailyStatus[game.id]?.done);
            return (
              <a
                key={game.id}
                href={game.path}
                onClick={(e) => {
                  if (isModifiedClick(e)) return;
                  e.preventDefault();
                  onSelectGame?.(game.id);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-white/[0.08] text-white'
                    : 'text-cinema-muted hover:text-white'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    done ? 'bg-emerald-400' : 'border border-slate-500'
                  }`}
                />
                <span>{game.shortName}</span>
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
