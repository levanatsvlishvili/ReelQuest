import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Crown,
  Flame,
  Trophy,
  Footprints,
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
  Camera,
  TrendingUp,
  Shield,
  Save,
  CheckCircle2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { getDetailedMatchHistory, fetchAndMergeUserHistory } from '../api/matchHistory';
import {
  evaluateAchievements,
  ACHIEVEMENT_TIERS,
  GAME_MODE_FILTERS
} from '../utils/achievements';
import {
  CINEMA_AVATARS,
  getAvatarById,
  calculateCinemaLevel
} from '../utils/cinemaLevels';
import { CinemaActivityHeatmap } from './CinemaActivityHeatmap';

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
  Award,
  Camera,
  TrendingUp
};

export function UserProfileView({ onBack, targetUser = null, onOpenPro }) {
  const { user: currentUser, stats: currentStats, updateUserProfile } = useAuth();

  // Determine if viewing own profile or someone else's public profile
  const isOwnProfile = !targetUser || (currentUser && targetUser.id === currentUser.id);

  // Active user data
  const profileUser = useMemo(() => {
    if (isOwnProfile) {
      return currentUser || { username: 'Guest Cinephile', id: 'guest', isPro: false };
    }
    // Viewing someone else: check if they have saved metadata locally or use targetUser
    try {
      const meta = JSON.parse(localStorage.getItem(`reelquest_user_meta_${targetUser.id}`) || '{}');
      return { ...targetUser, ...meta };
    } catch {
      return targetUser;
    }
  }, [isOwnProfile, currentUser, targetUser]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trophies' | 'history' | 'edit'
  const [trophyFilter, setTrophyFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [matchHistory, setMatchHistory] = useState(() => getDetailedMatchHistory(profileUser?.id));
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit form state
  const [editAvatarId, setEditAvatarId] = useState(profileUser?.avatarId || 'avatar-director');
  const [editUsername, setEditUsername] = useState(profileUser?.username || '');
  const [editBio, setEditBio] = useState(profileUser?.bio || '');
  const [editFavoriteDirector, setEditFavoriteDirector] = useState(profileUser?.favoriteDirector || '');
  const [editFavoriteMovie, setEditFavoriteMovie] = useState(profileUser?.favoriteMovie || '');
  const [editFavoriteGenre, setEditFavoriteGenre] = useState(profileUser?.favoriteGenre || 'Sci-Fi');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Keep edit form in sync when profileUser changes
  useEffect(() => {
    if (profileUser) {
      setEditAvatarId(profileUser.avatarId || 'avatar-director');
      setEditUsername(profileUser.username || '');
      setEditBio(profileUser.bio || '');
      setEditFavoriteDirector(profileUser.favoriteDirector || '');
      setEditFavoriteMovie(profileUser.favoriteMovie || '');
      setEditFavoriteGenre(profileUser.favoriteGenre || 'Sci-Fi');
    }
  }, [profileUser]);

  // Load and merge match history
  useEffect(() => {
    const userId = profileUser?.id || 'guest';
    const localMatches = getDetailedMatchHistory(userId);
    setMatchHistory(localMatches);

    if (profileUser && !profileUser.id?.startsWith('guest')) {
      setHistoryLoading(true);
      fetchAndMergeUserHistory(profileUser.id)
        .then(merged => {
          if (Array.isArray(merged) && merged.length > 0) {
            setMatchHistory(merged);
          }
        })
        .finally(() => setHistoryLoading(false));
    }
  }, [profileUser?.id]);

  // Dynamic user stats
  const activeStats = useMemo(() => {
    if (isOwnProfile) return currentStats || {};
    return {
      streak: targetUser.streak || 0,
      gamesPlayed: targetUser.moves || matchHistory.length || 0,
      gamesWon: targetUser.moves || matchHistory.filter(m => m.won).length || 0,
      totalScore: targetUser.score || 0
    };
  }, [isOwnProfile, currentStats, targetUser, matchHistory]);

  // Calculate Cinema Level & Progression
  const levelInfo = useMemo(() => {
    return calculateCinemaLevel(activeStats, matchHistory);
  }, [activeStats, matchHistory]);

  // Evaluate dynamic achievements
  const trophyData = useMemo(() => {
    return evaluateAchievements(profileUser?.id, profileUser, activeStats, matchHistory);
  }, [profileUser, activeStats, matchHistory]);

  const avatar = getAvatarById(isOwnProfile ? (profileUser?.avatarId || editAvatarId) : profileUser?.avatarId);

  // Filtered achievements
  const filteredAchievements = trophyData.achievements.filter(ach => {
    if (trophyFilter === 'all') return true;
    return ach.gameMode === trophyFilter;
  });

  // Filtered matches
  const filteredMatches = matchHistory.filter(m => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'daily') return m.gameMode === 'six-degrees' && m.subMode === 'daily';
    if (historyFilter === 'spotle') return m.gameMode === 'spotle';
    if (historyFilter === 'frame-sleuth') return m.gameMode === 'frame-sleuth';
    if (historyFilter === 'box-office') return m.gameMode === 'box-office';
    if (historyFilter === 'archive') return m.gameMode === 'six-degrees' && (m.subMode === 'archive' || m.subMode === 'custom');
    if (historyFilter === 'duels') return m.gameMode === 'duels';
    return m.gameMode === historyFilter;
  });

  const unlockedShowcase = trophyData.achievements.filter(a => a.isUnlocked && !a.isComingSoon).slice(0, 3);
  const winRate = activeStats?.gamesPlayed > 0 ? Math.round((activeStats.gamesWon / activeStats.gamesPlayed) * 100) : 0;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!updateUserProfile) return;

    updateUserProfile({
      avatarId: editAvatarId,
      username: editUsername.trim() || profileUser.username,
      bio: editBio.trim(),
      favoriteDirector: editFavoriteDirector.trim(),
      favoriteMovie: editFavoriteMovie.trim(),
      favoriteGenre: editFavoriteGenre.trim()
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('overview');
    }, 1200);
  };

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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Bar with Navigation Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/70 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-cinema-muted transition hover:border-gold/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{isOwnProfile ? 'Back to Game' : 'Back to Leaderboard'}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                {isOwnProfile ? 'My Cinephile Profile' : `${profileUser.username}'s Profile`}
              </h1>
              {!isOwnProfile && (
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                  Public Profile
                </span>
              )}
            </div>
            <p className="text-xs text-cinema-muted">
              {isOwnProfile
                ? 'Your Hollywood progression, activity heatmap, badges, and film history'
                : `Official statistics, trophies, and cinema journey of ${profileUser.username}`}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                : 'text-cinema-muted hover:text-white hover:bg-cinema-surface'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('trophies')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'trophies'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                : 'text-cinema-muted hover:text-white hover:bg-cinema-surface'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Trophies</span>
            <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300">
              {trophyData.unlockedCount}/{trophyData.totalCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                : 'text-cinema-muted hover:text-white hover:bg-cinema-surface'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Matches</span>
            {matchHistory.length > 0 && (
              <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300">
                {matchHistory.length}
              </span>
            )}
          </button>

          {isOwnProfile && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'edit'
                  ? 'bg-gold text-cinema-black shadow-gold-glow'
                  : 'text-cinema-muted hover:text-white hover:bg-cinema-surface'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner: Identity & Level Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-black p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Avatar & Bio */}
          <div className="flex items-start sm:items-center gap-4">
            {/* Avatar Badge */}
            <div className={`relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br shadow-xl ${avatar.bgGradient}`}>
              <span className="text-4xl sm:text-5xl select-none">{avatar.emoji}</span>
              <span className="absolute -bottom-2 rounded-full bg-cinema-black/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold border border-gold/40 shadow-md">
                Lv. {levelInfo.level}
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {profileUser.username}
                </h2>
                {profileUser.isPro ? (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-gold/25 to-amber-500/25 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/40 shadow-gold-glow">
                    <Crown className="h-3 w-3 fill-gold" />
                    PRO VIP
                  </span>
                ) : (
                  <span className="rounded-full bg-cinema-border px-2.5 py-0.5 text-[10px] font-semibold text-cinema-muted">
                    Cinephile
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${levelInfo.badgeColor}`}>
                  {levelInfo.title}
                </span>
              </div>

              {profileUser.bio ? (
                <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                  &ldquo;{profileUser.bio}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-cinema-muted italic">
                  {avatar.description}
                </p>
              )}

              {/* Cinema Favorites Tags */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                {profileUser.favoriteDirector && (
                  <span className="rounded-lg bg-cinema-surface/80 border border-cinema-border px-2 py-0.5 text-cinema-muted">
                    🎬 <strong className="text-slate-200">{profileUser.favoriteDirector}</strong>
                  </span>
                )}
                {profileUser.favoriteMovie && (
                  <span className="rounded-lg bg-cinema-surface/80 border border-cinema-border px-2 py-0.5 text-cinema-muted">
                    🍿 <strong className="text-slate-200">{profileUser.favoriteMovie}</strong>
                  </span>
                )}
                {profileUser.favoriteGenre && (
                  <span className="rounded-lg bg-cinema-surface/80 border border-cinema-border px-2 py-0.5 text-cinema-muted">
                    🎞️ <strong className="text-slate-200">{profileUser.favoriteGenre}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="rounded-xl border border-cinema-border bg-cinema-card/80 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-cinema-muted block">Total XP</span>
              <span className="text-sm sm:text-base font-black text-gold">{levelInfo.totalXp.toLocaleString()}</span>
            </div>

            <div className="rounded-xl border border-cinema-border bg-cinema-card/80 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-cinema-muted block">Streak</span>
              <span className="text-sm sm:text-base font-black text-orange-400 flex items-center justify-center gap-1">
                <Flame className="h-4 w-4 fill-orange-400" />
                {activeStats?.streak || 0}d
              </span>
            </div>

            <div className="rounded-xl border border-cinema-border bg-cinema-card/80 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-cinema-muted block">Win Rate</span>
              <span className="text-sm sm:text-base font-black text-emerald-400">{winRate}%</span>
            </div>

            <div className="rounded-xl border border-cinema-border bg-cinema-card/80 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-cinema-muted block">Trophies</span>
              <span className="text-sm sm:text-base font-black text-purple-300">
                {trophyData.unlockedCount}
              </span>
            </div>
          </div>
        </div>

        {/* Cinema Level XP Progress Bar */}
        <div className="mt-6 pt-5 border-t border-cinema-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">
                Level {levelInfo.level} — <span className="text-gold">{levelInfo.title}</span>
              </span>
              {levelInfo.streakShieldActive && (
                <span className="flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-300" title="Daily Streak Protected">
                  <Shield className="h-3 w-3 text-blue-400" />
                  Streak Shield
                </span>
              )}
              {levelInfo.streakMultiplier > 1 && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  <Flame className="h-3 w-3 text-amber-400" />
                  1.5x XP Bonanza
                </span>
              )}
            </div>

            <div className="text-cinema-muted text-[11px]">
              <strong className="text-white font-mono">{levelInfo.currentLevelProgressXp.toLocaleString()}</strong>
              {' / '}
              <span className="font-mono">{levelInfo.neededForNext.toLocaleString()} XP to Level {levelInfo.level + 1}</span>
              {' '}
              <span className="text-gold font-bold">({levelInfo.progressPercent}%)</span>
            </div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-cinema-black/80 border border-cinema-border/70 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-gold to-yellow-300 shadow-gold-glow transition-all duration-700"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW                                          */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* GitHub Activity Heatmap */}
          <CinemaActivityHeatmap matchHistory={matchHistory} />

          {/* Pro Banner if viewing own free profile */}
          {isOwnProfile && !profileUser.isPro && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-cinema-card to-amber-950/30 p-5 shadow-gold-glow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Upgrade to ReelQuest PRO VIP</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unlock Unlimited Otara hints, Custom Graph sandbox, Golden VIP avatar glow, and permanent Streak Shield protection.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenPro}
                className="shrink-0 rounded-xl bg-gold px-5 py-2.5 text-xs font-black text-cinema-black hover:opacity-90 shadow-gold-glow transition active:scale-95"
              >
                Get PRO Access
              </button>
            </div>
          )}

          {/* Unlocked Trophies Showcase & Recent Matches Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trophies Showcase */}
            <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-cinema-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  <h3 className="text-sm font-extrabold text-white">Trophy Cabinet Highlights</h3>
                </div>
                <button
                  onClick={() => setActiveTab('trophies')}
                  className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                >
                  <span>View All ({trophyData.unlockedCount})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {unlockedShowcase.length > 0 ? (
                <div className="space-y-2.5">
                  {unlockedShowcase.map(ach => {
                    const tier = ACHIEVEMENT_TIERS[ach.tier] || ACHIEVEMENT_TIERS.bronze;
                    const IconComponent = ICON_COMPONENTS[ach.icon] || Trophy;
                    return (
                      <div
                        key={ach.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 bg-gradient-to-br ${tier.bgGradient} ${tier.borderColor} ${tier.glowColor}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/50 border ${tier.borderColor} ${tier.textColor}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="truncate text-xs font-bold text-white">{ach.title}</h5>
                          <p className="text-[11px] text-slate-300 truncate">{ach.description}</p>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase shrink-0 ${tier.textColor}`}>
                          {tier.points} PTS
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-cinema-muted">
                  No trophies unlocked yet. Play Beat Otara, Spotle, Frame Sleuth, or Box Office Clash to earn cinema badges!
                </div>
              )}
            </div>

            {/* Recent Matches Showcase */}
            <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-cinema-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-gold" />
                  <h3 className="text-sm font-extrabold text-white">Recent Cinema Runs</h3>
                </div>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                >
                  <span>Full History ({matchHistory.length})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {matchHistory.length > 0 ? (
                <div className="space-y-2.5">
                  {matchHistory.slice(0, 3).map((m, idx) => {
                    const isWin = m.won;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-xl border border-cinema-border bg-cinema-surface/60 p-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            isWin
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              : 'border-cinema-border bg-cinema-card text-cinema-muted'
                          }`}>
                            {m.gameMode === 'spotle' ? (
                              <Film className="h-4 w-4 text-gold" />
                            ) : m.gameMode === 'frame-sleuth' ? (
                              <Camera className="h-4 w-4 text-violet-400" />
                            ) : m.gameMode === 'box-office' ? (
                              <TrendingUp className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Footprints className="h-4 w-4 text-gold" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="truncate text-xs font-bold text-white">
                              {m.gameMode === 'spotle'
                                ? `Spotle: ${m.targetMovie?.title || 'Movie'}`
                                : m.gameMode === 'frame-sleuth'
                                ? `Frame Sleuth: ${m.targetMovie?.title || 'Movie'}`
                                : m.gameMode === 'box-office'
                                ? `Box Office Clash`
                                : `Beat Otara: ${m.startActor?.name || 'Star'} → ${m.targetActor?.name || 'Star'}`}
                            </h5>
                            <span className="text-[10px] text-cinema-muted">
                              {formatMatchDate(m.date || m.timestamp)} • {m.durationSeconds || 0}s
                            </span>
                          </div>
                        </div>

                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${
                          isWin
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-slate-700/40 border-slate-600/40 text-slate-300'
                        }`}>
                          {isWin ? 'VICTORY' : 'PLAYED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-cinema-muted">
                  No cinema runs logged yet. Pick any game to start your journey!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TROPHY CABINET                                    */}
      {/* ======================================================== */}
      {activeTab === 'trophies' && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-cinema-surface to-amber-950/20 p-5 shadow-gold-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold" />
                  <h4 className="text-base font-extrabold text-white">
                    {trophyData.unlockedCount} of {trophyData.totalCount} Trophies Unlocked
                  </h4>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Accumulated Gamer Score: <strong className="text-gold font-mono">{trophyData.totalPoints} Cinema Points</strong>
                </p>
              </div>

              <span className="text-3xl font-black text-gold">{trophyData.completionPercentage}%</span>
            </div>

            <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-cinema-black/70 border border-cinema-border/60">
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
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  trophyFilter === f.id
                    ? 'bg-gold text-cinema-black shadow-gold-glow'
                    : 'bg-cinema-surface border border-cinema-border text-cinema-muted hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

                  {/* Progress Bar for Locked */}
                  {!isComingSoon && !isUnlocked && ach.maxProgress > 1 && (
                    <div className="mt-3 pt-2.5 border-t border-cinema-border/40">
                      <div className="flex justify-between text-[10px] text-cinema-muted mb-1">
                        <span>Progress</span>
                        <span className="font-mono">{ach.progress || 0} / {ach.maxProgress}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-cinema-black border border-cinema-border/50">
                        <div
                          className="h-full rounded-full bg-amber-500/60"
                          style={{ width: `${Math.min(100, Math.round(((ach.progress || 0) / ach.maxProgress) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isUnlocked && (
                    <div className="mt-3 pt-2 border-t border-cinema-border/40 flex items-center justify-end">
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-400">
                        <Check className="h-3 w-3" />
                        UNLOCKED
                      </span>
                    </div>
                  )}
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
        <div className="space-y-6">
          {/* History Mode Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Modes' },
              { id: 'daily', label: 'Beat Otara Daily' },
              { id: 'spotle', label: 'Spotle' },
              { id: 'frame-sleuth', label: 'Frame Sleuth' },
              { id: 'box-office', label: 'Box Office Clash' },
              { id: 'duels', label: '1v1 Duels' },
              { id: 'archive', label: 'Archive Runs' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setHistoryFilter(f.id)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  historyFilter === f.id
                    ? 'bg-gold text-cinema-black shadow-gold-glow'
                    : 'bg-cinema-surface border border-cinema-border text-cinema-muted hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMatches.length > 0 ? (
            <div className="space-y-3">
              {filteredMatches.map((m, idx) => {
                const isWin = m.won;
                const isSpotle = m.gameMode === 'spotle';
                const isFrameSleuth = m.gameMode === 'frame-sleuth';
                const isBoxOffice = m.gameMode === 'box-office';
                const isDuel = m.gameMode === 'duels';
                const isArchive = m.subMode === 'archive' || m.subMode === 'custom';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-4 transition-all duration-200 ${
                      isWin
                        ? 'border-emerald-500/30 bg-cinema-surface/70 hover:border-emerald-500/50'
                        : 'border-cinema-border bg-cinema-surface/40 hover:border-cinema-border/80'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-cinema-border/40 pb-2.5">
                      <div className="flex items-center gap-2">
                        {isBoxOffice ? (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                            <TrendingUp className="h-3 w-3 text-emerald-400" />
                            BOX OFFICE {m.subMode === 'streak' ? 'STREAK' : 'DAILY 5-ROUND'}
                          </span>
                        ) : isFrameSleuth ? (
                          <span className="flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-violet-300 border border-violet-500/30">
                            <Camera className="h-3 w-3 text-violet-400" />
                            FRAME SLEUTH {m.subMode === 'archive' ? 'ARCHIVE' : 'DAILY'}
                          </span>
                        ) : isSpotle ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                            <Film className="h-3 w-3 text-gold" />
                            SPOTLE {m.subMode === 'archive' ? 'ARCHIVE' : 'DAILY'}
                          </span>
                        ) : isDuel ? (
                          <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-cyan-300 border border-cyan-500/30">
                            <Swords className="h-3 w-3" />
                            1v1 DUEL
                          </span>
                        ) : isArchive ? (
                          <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                            <History className="h-3 w-3" />
                            ARCHIVE RUN
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/30">
                            <Calendar className="h-3 w-3" />
                            BEAT OTARA DAILY
                          </span>
                        )}

                        <span className="text-[11px] text-cinema-muted">
                          {formatMatchDate(m.date || m.timestamp)}
                        </span>
                      </div>

                      <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                        isWin
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-700/60 border-slate-600/50 text-slate-300'
                      }`}>
                        {isWin ? <Check className="h-3 w-3" /> : null}
                        {isWin ? (m.matchedOtara ? 'MATCHED OTARA' : 'VICTORY') : 'COMPLETED'}
                      </span>
                    </div>

                    {/* Middle: Details */}
                    {isBoxOffice ? (
                      <div className="mt-3 flex items-center justify-between gap-3 bg-cinema-black/40 rounded-xl p-3 border border-cinema-border/30">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">Box Office Clash Run</h4>
                            <span className="text-[10px] text-cinema-muted">
                              {m.subMode === 'streak' ? 'Endless Streak Challenge' : 'Daily 5-Round Global Showdown'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-cinema-muted block">Score</span>
                          <span className="text-xs font-black text-emerald-400 font-mono">
                            {m.subMode === 'streak' ? `${m.hops || 0} 🔥` : `${m.hops || 0}/5`}
                          </span>
                        </div>
                      </div>
                    ) : (isSpotle || isFrameSleuth) && m.targetMovie ? (
                      <div className="mt-3 flex items-center justify-between gap-3 bg-cinema-black/40 rounded-xl p-3 border border-cinema-border/30">
                        <div className="flex items-center gap-3 min-w-0">
                          {m.targetMovie.posterPath ? (
                            <img
                              src={getTmdbImageUrl(m.targetMovie.posterPath)}
                              alt={m.targetMovie.title}
                              className="h-12 w-8 rounded object-cover border border-cinema-border shrink-0"
                            />
                          ) : (
                            <div className="flex h-12 w-8 items-center justify-center rounded bg-cinema-surface border border-cinema-border text-gold shrink-0">
                              <Film className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {m.targetMovie.title} {m.targetMovie.year ? `(${m.targetMovie.year})` : ''}
                            </h4>
                            {m.targetMovie.director && (
                              <span className="text-[10px] text-cinema-muted truncate block">
                                Dir. {m.targetMovie.director}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] uppercase font-bold text-cinema-muted block">
                            {isFrameSleuth ? 'Frames' : 'Guesses'}
                          </span>
                          <span className="text-xs font-black text-gold">
                            {isFrameSleuth ? `${m.framesUsed || m.hops || 1}/6` : `${m.hops || 1}/10`}
                          </span>
                        </div>
                      </div>
                    ) : (m.startActor || m.targetActor) && (
                      <div className="mt-3 flex items-center justify-between gap-3 bg-cinema-black/40 rounded-xl p-3 border border-cinema-border/30">
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
                          <span className="truncate text-xs font-bold text-white">{m.startActor?.name}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] font-bold text-gold shrink-0 px-2">
                          <span>{m.hops} hops</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </div>

                        <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                          <span className="truncate text-xs font-bold text-white text-right">{m.targetActor?.name}</span>
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

                    {/* Footer Details */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-cinema-muted">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-cinema-muted" />
                        <span>{m.durationSeconds || 0}s duration</span>
                      </span>

                      {m.optimalHops && (
                        <span className="text-[10px] text-cinema-muted">
                          (Par: {m.optimalHops} hops)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-cinema-muted space-y-2">
              <History className="h-8 w-8 mx-auto text-cinema-muted/60" />
              <p className="text-sm font-bold text-white">No matches found for this filter</p>
              <p className="text-xs">Play games to build up your cinema career record!</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: EDIT PROFILE & AVATAR (OWN PROFILE ONLY)          */}
      {/* ======================================================== */}
      {isOwnProfile && activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar Selector Grid */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Select Your Cinema Persona</span>
                <span className="text-xs font-normal text-cinema-muted">({CINEMA_AVATARS.length} Curated Avatars)</span>
              </h3>
              <p className="text-xs text-cinema-muted mt-0.5">
                Your chosen avatar is displayed on the leaderboard, duel matches, and navbar profile.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CINEMA_AVATARS.map(av => {
                const isSelected = editAvatarId === av.id;
                return (
                  <button
                    type="button"
                    key={av.id}
                    onClick={() => setEditAvatarId(av.id)}
                    className={`relative flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all duration-200 ${
                      isSelected
                        ? 'border-gold bg-gold/15 shadow-gold-glow scale-[1.02]'
                        : 'border-cinema-border bg-cinema-surface/50 hover:border-cinema-muted'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-cinema-black shadow">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}

                    <div className={`flex h-14 w-14 items-center justify-center rounded-xl border bg-gradient-to-br text-3xl shadow-inner mb-2 ${av.bgGradient}`}>
                      {av.emoji}
                    </div>

                    <div className="w-full">
                      <h4 className="text-xs font-extrabold text-white truncate">{av.name}</h4>
                      <span className="text-[10px] font-semibold text-gold block truncate">{av.title}</span>
                      <p className="mt-1 text-[10px] text-cinema-muted line-clamp-2 leading-tight">
                        {av.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile Details Inputs */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-white">Cinephile Details & Favorites</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Display Name / Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  maxLength={24}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="e.g. CinemaVoyager"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Favorite Film Genre
                </label>
                <select
                  value={editFavoriteGenre}
                  onChange={(e) => setEditFavoriteGenre(e.target.value)}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white focus:border-gold focus:outline-none"
                >
                  {['Sci-Fi', 'Neo-Noir', 'Psychological Thriller', 'Drama', 'Action Blockbuster', 'Horror', 'Animation', 'Crime', 'Western', 'Adventure', 'Mystery', 'Comedy'].map(g => (
                    <option key={g} value={g} className="bg-cinema-card text-white">{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Favorite Director
                </label>
                <input
                  type="text"
                  value={editFavoriteDirector}
                  onChange={(e) => setEditFavoriteDirector(e.target.value)}
                  maxLength={40}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="e.g. Christopher Nolan, Stanley Kubrick, Denis Villeneuve"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  All-Time Favorite Movie
                </label>
                <input
                  type="text"
                  value={editFavoriteMovie}
                  onChange={(e) => setEditFavoriteMovie(e.target.value)}
                  maxLength={50}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="e.g. Interstellar, Pulp Fiction, 2001: A Space Odyssey"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Bio / Cinephile Tagline
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  maxLength={140}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="Share a short quote, your cinema philosophy, or what movies mean to you..."
                />
                <span className="text-[10px] text-cinema-muted text-right block mt-1">
                  {editBio.length} / 140 characters
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-between">
              {saveSuccess ? (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Profile updated successfully! Redirecting...</span>
                </div>
              ) : <div />}

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-gold px-6 py-2.5 text-xs font-black text-cinema-black hover:opacity-90 shadow-gold-glow transition active:scale-95"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
