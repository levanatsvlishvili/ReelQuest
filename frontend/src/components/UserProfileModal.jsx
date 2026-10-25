import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Crown,
  Flame,
  Trophy,
  Footprints,
  LogOut,
  Sparkles,
  Check,
  Clock,
  Lock,
  History,
  Film,
  Swords,
  Target,
  Zap,
  Award,
  ArrowRight,
  User,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { getDetailedMatchHistory, fetchAndMergeUserHistory } from '../api/matchHistory';
import {
  evaluateAchievements,
  ACHIEVEMENT_TIERS,
  GAME_MODE_FILTERS
} from '../utils/achievements';

const ICON_COMPONENTS = {
  Footprints,
  Target,
  Crown,
  Clock,
  Film,
  History,
  Sparkles,
  Trophy,
  Swords,
  Zap,
  Flame,
  Award
};

export function UserProfileModal({ isOpen, onClose, onOpenPro }) {
  const { user, stats, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trophies' | 'history'
  const [trophyFilter, setTrophyFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [matchHistory, setMatchHistory] = useState(() => getDetailedMatchHistory(user?.id));
  const [historyLoading, setHistoryLoading] = useState(false);

  // Load match history and merge with server history
  useEffect(() => {
    if (!isOpen) return;
    const userId = user?.id || 'guest';
    const localMatches = getDetailedMatchHistory(userId);
    setMatchHistory(localMatches);

    if (user && !user.id?.startsWith('guest')) {
      setHistoryLoading(true);
      fetchAndMergeUserHistory(user.id)
        .then(merged => {
          if (Array.isArray(merged)) {
            setMatchHistory(merged);
          }
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [isOpen, user?.id]);

  // Evaluate achievements dynamically
  const trophyData = useMemo(() => {
    return evaluateAchievements(user?.id, user, stats || {}, matchHistory);
  }, [user, stats, matchHistory]);

  if (!isOpen || !user) return null;

  const winRate = stats?.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  const initials = (user.username || user.email || 'U').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    onClose();
  };

  // Filtered achievements
  const filteredAchievements = trophyData.achievements.filter(ach => {
    if (trophyFilter === 'all') return true;
    return ach.gameMode === trophyFilter;
  });

  // Filtered matches
  const filteredMatches = matchHistory.filter(m => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'daily') return m.gameMode === 'six-degrees' && m.subMode === 'daily';
    if (historyFilter === 'archive') return m.gameMode === 'six-degrees' && (m.subMode === 'archive' || m.subMode === 'custom');
    if (historyFilter === 'duels') return m.gameMode === 'duels';
    return m.gameMode === historyFilter;
  });

  const unlockedShowcase = trophyData.achievements.filter(a => a.isUnlocked && !a.isComingSoon).slice(0, 3);

  const formatMatchDate = (isoOrDateStr) => {
    if (!isoOrDateStr) return 'Recent Match';
    try {
      const d = new Date(isoOrDateStr);
      if (isNaN(d.getTime())) return isoOrDateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoOrDateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cinema-border bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-cinema-muted transition hover:bg-cinema-border hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* User Identity Header */}
        <div className="shrink-0 border-b border-cinema-border/80 px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15 text-lg font-black text-gold border border-gold/30 shadow-gold-glow">
              {initials}
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="truncate text-base font-bold text-white">{user.username}</h3>
                {user.isPro ? (
                  <span className="flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/30 shadow-gold-glow">
                    <Crown className="h-3 w-3 fill-gold" />
                    PRO VIP
                  </span>
                ) : (
                  <span className="rounded-full bg-cinema-border px-2 py-0.5 text-[10px] font-semibold text-cinema-muted">
                    Free Member
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-cinema-muted">{user.email}</p>
            </div>
          </div>

          {/* Tab Navigation Switcher */}
          <div className="mt-5 flex items-center gap-2 border-b border-cinema-border/60 pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'overview'
                  ? 'bg-gold/15 text-gold border border-gold/40 shadow-gold-glow'
                  : 'text-cinema-muted hover:text-slate-200 hover:bg-cinema-surface'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('trophies')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'trophies'
                  ? 'bg-gold/15 text-gold border border-gold/40 shadow-gold-glow'
                  : 'text-cinema-muted hover:text-slate-200 hover:bg-cinema-surface'
              }`}
            >
              <Trophy className="h-4 w-4" />
              <span>Trophy Cabinet</span>
              <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300">
                {trophyData.unlockedCount}/{trophyData.totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-gold/15 text-gold border border-gold/40 shadow-gold-glow'
                  : 'text-cinema-muted hover:text-slate-200 hover:bg-cinema-surface'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Match History</span>
              {matchHistory.length > 0 && (
                <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300">
                  {matchHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body - Tab Views */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW                                          */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Pro Banner if Free */}
              {!user.isPro && (
                <div className="flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-5 w-5 text-gold shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-gold">Unlock ReelQuest Pro VIP</h4>
                      <p className="text-[11px] text-slate-300">Unlimited Otara hints, custom graph paths & VIP status</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPro();
                    }}
                    className="shrink-0 rounded-lg bg-gold px-3 py-1.5 text-xs font-extrabold text-cinema-black hover:opacity-90 shadow-gold-glow"
                  >
                    Upgrade
                  </button>
                </div>
              )}

              {/* Core Stats Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cinema-muted mb-3">
                  Cinema Performance
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-cinema-border bg-cinema-surface/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-orange-400">
                      <Flame className="h-4 w-4 fill-orange-400/20" />
                      <span className="font-semibold">Daily Streak</span>
                    </div>
                    <div className="mt-1 text-xl font-black text-white">{stats.streak || 0} Days</div>
                  </div>

                  <div className="rounded-xl border border-cinema-border bg-cinema-surface/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Trophy className="h-4 w-4" />
                      <span className="font-semibold">Win Rate</span>
                    </div>
                    <div className="mt-1 text-xl font-black text-white">{winRate}%</div>
                  </div>

                  <div className="rounded-xl border border-cinema-border bg-cinema-surface/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-gold">
                      <Footprints className="h-4 w-4" />
                      <span className="font-semibold">Best Hops</span>
                    </div>
                    <div className="mt-1 text-xl font-black text-white">{stats.bestHops || 2}</div>
                  </div>

                  <div className="rounded-xl border border-cinema-border bg-cinema-surface/70 p-3">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">Games Played</span>
                    </div>
                    <div className="mt-1 text-xl font-black text-white">{stats.gamesPlayed || 0}</div>
                  </div>
                </div>
              </div>

              {/* Cabinet Spotlight Preview */}
              <div className="rounded-2xl border border-cinema-border bg-cinema-surface/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gold" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Trophy Cabinet Spotlight
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('trophies')}
                    className="flex items-center gap-1 text-[11px] font-bold text-gold hover:underline"
                  >
                    <span>View All ({trophyData.unlockedCount})</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {unlockedShowcase.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {unlockedShowcase.map(ach => {
                      const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.bronze;
                      const IconComponent = ICON_COMPONENTS[ach.icon] || Trophy;
                      return (
                        <div
                          key={ach.id}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 bg-gradient-to-br ${tier.bgGradient} ${tier.borderColor} ${tier.glowColor}`}
                        >
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/40 border ${tier.borderColor} ${tier.textColor}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="truncate text-xs font-bold text-white">{ach.title}</h5>
                            <span className={`text-[10px] font-extrabold uppercase ${tier.textColor}`}>
                              {tier.name} • {tier.points} PTS
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-cinema-muted">
                    No trophies unlocked yet. Play Beat Otara or 1v1 Duels to fill your cabinet!
                  </div>
                )}
              </div>

              {/* Sign Out Action */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface py-2.5 text-xs font-semibold text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TROPHY CABINET                                    */}
          {/* ======================================================== */}
          {activeTab === 'trophies' && (
            <div className="space-y-5 animate-fade-in">
              {/* Cabinet Progress Summary Banner */}
              <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-cinema-surface to-amber-950/20 p-4 shadow-gold-glow">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-gold" />
                      <h4 className="text-sm font-extrabold text-white">
                        {trophyData.unlockedCount} of {trophyData.totalCount} Trophies Unlocked
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300">
                      Total Gamer Score: <strong className="text-gold">{trophyData.totalPoints} Cinema Points</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gold">{trophyData.completionPercentage}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cinema-black/70 border border-cinema-border/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-gold transition-all duration-500"
                    style={{ width: `${trophyData.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Game Mode Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {GAME_MODE_FILTERS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTrophyFilter(f.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      trophyFilter === f.id
                        ? 'bg-gold text-cinema-black shadow-gold-glow'
                        : 'bg-cinema-surface border border-cinema-border text-cinema-muted hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Achievement Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredAchievements.map(ach => {
                  const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.bronze;
                  const IconComponent = ICON_COMPONENTS[ach.icon] || Trophy;
                  const isUnlocked = ach.isUnlocked;
                  const isComingSoon = ach.isComingSoon;

                  return (
                    <div
                      key={ach.id}
                      className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 ${
                        isComingSoon
                          ? 'border-indigo-500/30 bg-indigo-950/20 opacity-80'
                          : isUnlocked
                          ? `border-opacity-80 bg-gradient-to-br ${tier.bgGradient} ${tier.borderColor} ${tier.glowColor}`
                          : 'border-cinema-border bg-cinema-surface/40 opacity-75'
                      }`}
                    >
                      {/* Top Row: Icon + Tier & Title */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                            isComingSoon
                              ? 'border-indigo-400/30 bg-indigo-900/30 text-indigo-300'
                              : isUnlocked
                              ? `border ${tier.borderColor} bg-black/50 ${tier.textColor} shadow-md`
                              : 'border-cinema-border bg-cinema-black/40 text-cinema-muted'
                          }`}
                        >
                          {isComingSoon ? (
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                          ) : isUnlocked ? (
                            <IconComponent className="h-5 w-5" />
                          ) : (
                            <Lock className="h-4 w-4 text-cinema-muted" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs font-bold text-white truncate">{ach.title}</h5>
                            {isComingSoon ? (
                              <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-indigo-300 border border-indigo-500/30">
                                {ach.comingSoonTag || 'COMING SOON'}
                              </span>
                            ) : (
                              <span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${tier.badgeBg}`}>
                                {tier.name} • {tier.points} PTS
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                            {ach.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Status / Progress */}
                      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px]">
                        {isComingSoon ? (
                          <span className="text-[10px] font-bold text-indigo-400">
                            Unlocks with future game update
                          </span>
                        ) : isUnlocked ? (
                          <>
                            <span className="flex items-center gap-1 font-bold text-emerald-400">
                              <Check className="h-3.5 w-3.5" />
                              <span>UNLOCKED</span>
                            </span>
                            {ach.unlockedAt && (
                              <span className="text-[10px] text-cinema-muted">
                                {formatMatchDate(ach.unlockedAt)}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-full space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-semibold text-cinema-muted">
                              <span>Requirement Progress</span>
                              <span>
                                {ach.progress} / {ach.maxProgress}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-cinema-black border border-cinema-border/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gold/70"
                                style={{ width: `${Math.round((ach.progress / ach.maxProgress) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: MATCH HISTORY                                     */}
          {/* ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              {/* Sub-Filters */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'all', label: 'All Matches' },
                    { id: 'daily', label: 'Beat Otara (Daily)' },
                    { id: 'archive', label: 'Archive & Custom' },
                    { id: 'duels', label: '1v1 Online Duels' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setHistoryFilter(f.id)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        historyFilter === f.id
                          ? 'bg-gold text-cinema-black shadow-gold-glow'
                          : 'bg-cinema-surface border border-cinema-border text-cinema-muted hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {historyLoading && (
                  <span className="text-[11px] text-cinema-muted animate-pulse">
                    Syncing history...
                  </span>
                )}
              </div>

              {/* Match Cards List */}
              {filteredMatches.length > 0 ? (
                <div className="space-y-3">
                  {filteredMatches.map(m => {
                    const isWin = m.won;
                    const isDuel = m.gameMode === 'duels';
                    const isArchive = m.subMode === 'archive';
                    const isCustom = m.subMode === 'custom';

                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl border p-4 transition ${
                          isWin
                            ? 'border-emerald-500/30 bg-cinema-surface/70 hover:border-emerald-500/50'
                            : 'border-cinema-border bg-cinema-surface/40 hover:border-cinema-border/80'
                        }`}
                      >
                        {/* Header: Mode Badge + Date + Result */}
                        <div className="flex items-center justify-between gap-2 border-b border-cinema-border/40 pb-2.5">
                          <div className="flex items-center gap-2">
                            {isDuel ? (
                              <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-300 border border-cyan-500/30">
                                <Swords className="h-3 w-3" />
                                1v1 DUEL {m.roomCode ? `#${m.roomCode}` : ''}
                              </span>
                            ) : isCustom ? (
                              <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-300 border border-purple-500/30">
                                <Film className="h-3 w-3" />
                                CUSTOM PATH
                              </span>
                            ) : isArchive ? (
                              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                                <History className="h-3 w-3" />
                                ARCHIVE RUN
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/30">
                                <Calendar className="h-3 w-3" />
                                DAILY CHALLENGE
                              </span>
                            )}

                            <span className="text-[11px] text-cinema-muted">
                              {formatMatchDate(m.date || m.timestamp)}
                            </span>
                          </div>

                          <div>
                            {m.forfeited ? (
                              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-extrabold text-red-400 border border-red-500/30">
                                FORFEITED
                              </span>
                            ) : isWin ? (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 border border-emerald-500/30">
                                <Check className="h-3 w-3" />
                                {m.matchedOtara ? 'MATCHED OTARA' : 'VICTORY'}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 text-[10px] font-extrabold text-slate-300">
                                DEFEAT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Actor Route */}
                        {(m.startActor || m.targetActor) && (
                          <div className="mt-3 flex items-center justify-between gap-3 bg-cinema-black/40 rounded-xl p-2.5 border border-cinema-border/30">
                            {/* Start Actor */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {m.startActor?.profilePath ? (
                                <img
                                  src={getTmdbImageUrl(m.startActor.profilePath)}
                                  alt={m.startActor.name}
                                  className="h-8 w-8 rounded-lg object-cover border border-cinema-border"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cinema-surface text-cinema-muted border border-cinema-border">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                              <span className="truncate text-xs font-bold text-white">
                                {m.startActor?.name || 'Start Star'}
                              </span>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="flex items-center gap-1 text-[11px] font-bold text-gold shrink-0 px-2">
                              <span>{m.hops} hops</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>

                            {/* Target Actor */}
                            <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                              <span className="truncate text-xs font-bold text-white text-right">
                                {m.targetActor?.name || 'Target Star'}
                              </span>
                              {m.targetActor?.profilePath ? (
                                <img
                                  src={getTmdbImageUrl(m.targetActor.profilePath)}
                                  alt={m.targetActor.name}
                                  className="h-8 w-8 rounded-lg object-cover border border-cinema-border"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cinema-surface text-cinema-muted border border-cinema-border">
                                  <User className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Footer: Details & Badges */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-cinema-muted">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Clock className="h-3.5 w-3.5 text-cinema-muted" />
                              <span>{m.durationSeconds || 0}s</span>
                            </span>

                            {m.optimalHops && (
                              <span className="text-[10px] text-cinema-muted">
                                (Par: {m.optimalHops} hops)
                              </span>
                            )}

                            {isDuel && m.opponentName && (
                              <span className="flex items-center gap-1 font-semibold text-slate-300">
                                <Swords className="h-3 w-3 text-cyan-400" />
                                <span>vs {m.opponentName}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {m.usedHint && (
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-300">
                                <Sparkles className="h-3 w-3" /> Hint Used
                              </span>
                            )}
                            {m.undos === 0 && isWin && (
                              <span className="text-[10px] font-semibold text-emerald-400">
                                0 Undos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-cinema-border/50 bg-cinema-surface/20 space-y-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/30">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">No Matches Found</h5>
                    <p className="mt-1 text-xs text-cinema-muted max-w-sm">
                      You haven't played any matches in this category yet. Launch a Daily challenge or 1v1 duel to start building your cinema legacy!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
