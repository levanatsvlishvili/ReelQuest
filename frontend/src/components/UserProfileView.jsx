import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Edit3,
  CreditCard,
  AlertTriangle,
  Upload,
  Trash2,
  Mail,
  Receipt
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
import { getCountryByCode } from '../utils/countries';
import { CountrySelect } from './CountrySelect';
import {
  getSubscription,
  updatePaymentMethod,
  setAutoRenew
} from '../utils/billingService';
import { processAvatarImage } from '../utils/imageUpload';
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
    try {
      const meta = JSON.parse(localStorage.getItem(`reelquest_user_meta_${targetUser.id}`) || '{}');
      return { ...targetUser, ...meta };
    } catch {
      return targetUser;
    }
  }, [isOwnProfile, currentUser, targetUser]);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'trophies' | 'history' | 'billing' | 'edit'
  const [trophyFilter, setTrophyFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [matchHistory, setMatchHistory] = useState(() => getDetailedMatchHistory(profileUser?.id));
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit form state
  const [editAvatarId, setEditAvatarId] = useState(profileUser?.avatarId || 'avatar-director');
  const [customAvatarUrl, setCustomAvatarUrl] = useState(profileUser?.customAvatarUrl || null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Personal Info form fields (Strictly English)
  const [editFirstName, setEditFirstName] = useState(profileUser?.firstName || '');
  const [editLastName, setEditLastName] = useState(profileUser?.lastName || '');
  const [editUsername, setEditUsername] = useState(profileUser?.username || '');
  const [editCountryCode, setEditCountryCode] = useState(profileUser?.countryCode || 'GE');
  const [editBio, setEditBio] = useState(profileUser?.bio || '');
  const [editFavoriteDirector, setEditFavoriteDirector] = useState(profileUser?.favoriteDirector || '');
  const [editFavoriteMovie, setEditFavoriteMovie] = useState(profileUser?.favoriteMovie || '');
  const [editFavoriteGenre, setEditFavoriteGenre] = useState(profileUser?.favoriteGenre || 'Sci-Fi');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subscription & Billing state
  const [subscription, setSubscription] = useState(() =>
    getSubscription(profileUser?.id, profileUser?.email, profileUser?.isPro)
  );
  const [billingNotice, setBillingNotice] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardHolder, setCardHolder] = useState(profileUser?.username || 'Cinephile');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Keep form in sync when profileUser changes
  useEffect(() => {
    if (profileUser) {
      setEditAvatarId(profileUser.avatarId || 'avatar-director');
      setCustomAvatarUrl(profileUser.customAvatarUrl || null);
      setEditFirstName(profileUser.firstName || '');
      setEditLastName(profileUser.lastName || '');
      setEditUsername(profileUser.username || '');
      setEditCountryCode(profileUser.countryCode || 'GE');
      setEditBio(profileUser.bio || '');
      setEditFavoriteDirector(profileUser.favoriteDirector || '');
      setEditFavoriteMovie(profileUser.favoriteMovie || '');
      setEditFavoriteGenre(profileUser.favoriteGenre || 'Sci-Fi');

      const sub = getSubscription(profileUser.id, profileUser.email, profileUser.isPro);
      setSubscription(sub);
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
  const activeCountry = getCountryByCode(profileUser?.countryCode || editCountryCode);

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

  // Custom Avatar File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const processed = await processAvatarImage(file);
      setCustomAvatarUrl(processed.dataUrl);
      if (updateUserProfile) {
        updateUserProfile({ customAvatarUrl: processed.dataUrl });
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to upload avatar image.');
    }
  };

  const handleRemoveCustomAvatar = () => {
    setCustomAvatarUrl(null);
    if (updateUserProfile) {
      updateUserProfile({ customAvatarUrl: null });
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!updateUserProfile) return;

    const selectedCountry = getCountryByCode(editCountryCode);

    updateUserProfile({
      avatarId: editAvatarId,
      customAvatarUrl,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      countryCode: selectedCountry.code,
      nationality: selectedCountry.name,
      countryFlag: selectedCountry.flag,
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

  // Billing Actions
  const handleUpdateCardSubmit = (e) => {
    e.preventDefault();
    const last4 = cardNumber.replace(/\D/g, '').slice(-4) || '4242';
    const brand = cardNumber.startsWith('3') ? 'Amex' : cardNumber.startsWith('5') ? 'Mastercard' : 'Visa';
    const [expMonth, expYear] = cardExp.split('/').map(s => s.trim());

    const updated = updatePaymentMethod(profileUser.id, {
      cardholderName: cardHolder,
      brand,
      last4,
      expMonth: parseInt(expMonth, 10) || 12,
      expYear: parseInt(expYear, 10) || 2028
    });

    setSubscription(updated);
    setShowCardModal(false);
    setBillingNotice({ type: 'success', text: `Payment method updated to ${brand} ending in ${last4}!` });
    setTimeout(() => setBillingNotice(null), 4000);
  };

  const handleToggleAutoRenew = () => {
    const nextState = !subscription?.cancelAtPeriodEnd;
    const updated = setAutoRenew(profileUser.id, nextState);
    setSubscription(updated);
    setBillingNotice({
      type: 'info',
      text: nextState
        ? 'Automatic renewal cancelled. Your PRO perks remain active until the end of the billing period.'
        : 'Automatic monthly renewal ($3.00/mo) re-enabled.'
    });
    setTimeout(() => setBillingNotice(null), 4000);
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
      {/* Return to Leaderboard Link (Only shown when inspecting someone else's public profile) */}
      {!isOwnProfile && (
        <div className="flex items-center justify-between border-b border-cinema-border/70 pb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-1.5 text-xs font-semibold text-cinema-muted transition hover:border-gold hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Leaderboard</span>
          </button>
          <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">
            Viewing Public Cinephile Profile
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. HERO IDENTITY & PROGRESSION BANNER                    */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-black p-6 sm:p-7 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Left: Avatar & Personal Info */}
          <div className="flex items-start sm:items-center gap-5">
            {/* Avatar Badge: Custom Photo OR Preset Avatar */}
            <div className={`relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl border-2 bg-gradient-to-br shadow-xl overflow-hidden ${
              customAvatarUrl ? 'border-gold shadow-gold-glow bg-black/60' : avatar.bgGradient
            }`}>
              {customAvatarUrl ? (
                <img
                  src={customAvatarUrl}
                  alt={profileUser.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl sm:text-5xl select-none">{avatar.emoji}</span>
              )}
              <span className="absolute -bottom-1 rounded-full bg-cinema-black/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-gold border border-gold/40 shadow-md">
                Lv. {levelInfo.level}
              </span>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {profileUser.username}
                </h2>

                {/* Country Flag Badge (195 Sovereign Countries) */}
                <span className="flex items-center gap-1.5 rounded-full bg-cinema-surface/90 border border-cinema-border px-2.5 py-0.5 text-xs font-bold text-slate-200" title={activeCountry.name}>
                  <span className="text-base">{activeCountry.flag}</span>
                  <span className="text-[11px] font-semibold">{activeCountry.name}</span>
                </span>

                {profileUser.isPro ? (
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-gold/25 to-amber-500/25 px-2.5 py-0.5 text-[10px] font-extrabold text-gold border border-gold/40 shadow-gold-glow">
                    <Crown className="h-3 w-3 fill-gold" />
                    PRO VIP ($3/mo)
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

              {/* Full Name & Email */}
              {(profileUser.firstName || profileUser.lastName) && (
                <p className="text-xs font-bold text-slate-200">
                  {profileUser.firstName} {profileUser.lastName}
                  {profileUser.email && (
                    <span className="text-cinema-muted font-normal ml-2">({profileUser.email})</span>
                  )}
                </p>
              )}

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
      {/* 2. FULL-WIDTH PROFILE NAVIGATION TABS                    */}
      {/* Ensures "Edit Profile" & all tabs are 100% visible       */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 border-b border-cinema-border/70 pb-3 overflow-x-auto scrollbar-none w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition ${
            activeTab === 'overview'
              ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
              : 'text-cinema-muted hover:text-white hover:bg-cinema-surface border border-transparent'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('trophies')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition ${
            activeTab === 'trophies'
              ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
              : 'text-cinema-muted hover:text-white hover:bg-cinema-surface border border-transparent'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Trophies</span>
          <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
            {trophyData.unlockedCount}/{trophyData.totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition ${
            activeTab === 'history'
              ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
              : 'text-cinema-muted hover:text-white hover:bg-cinema-surface border border-transparent'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Matches</span>
          {matchHistory.length > 0 && (
            <span className="rounded-full bg-cinema-border px-1.5 py-0.2 text-[10px] text-slate-300 font-mono">
              {matchHistory.length}
            </span>
          )}
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition ${
              activeTab === 'billing'
                ? 'bg-gold/20 text-gold border border-gold/40 shadow-gold-glow'
                : 'text-cinema-muted hover:text-white hover:bg-cinema-surface border border-transparent'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Pro & Billing</span>
            {subscription?.status === 'PAST_DUE' && (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>
        )}

        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap shrink-0 transition ${
              activeTab === 'edit'
                ? 'bg-gold text-cinema-black shadow-gold-glow'
                : 'bg-cinema-surface/70 border border-cinema-border text-slate-200 hover:border-gold hover:text-gold'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW                                          */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* GitHub Activity Heatmap */}
          <CinemaActivityHeatmap matchHistory={matchHistory} />

          {/* Account Personal Details Card */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-cinema-border/50 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-extrabold text-white">Cinephile Identity & Credentials</h3>
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => setActiveTab('edit')}
                  className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Full Name</span>
                <span className="font-bold text-white text-sm">
                  {profileUser.firstName || profileUser.lastName
                    ? `${profileUser.firstName || ''} ${profileUser.lastName || ''}`.trim()
                    : 'Not Specified'}
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Email Address</span>
                <span className="font-bold text-white truncate block text-sm" title={profileUser.email}>
                  {profileUser.email || 'guest@reelquest.io'}
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Nationality</span>
                <span className="font-bold text-white flex items-center gap-1.5 text-sm">
                  <span className="text-base">{activeCountry.flag}</span>
                  <span>{activeCountry.name}</span>
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Subscription Tier</span>
                <span className="font-extrabold text-sm flex items-center gap-1 text-gold">
                  <Crown className="h-3.5 w-3.5" />
                  <span>{profileUser.isPro ? 'Pro VIP ($3/mo)' : 'Free Member'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pro Banner if viewing own free profile */}
          {isOwnProfile && !profileUser.isPro && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/15 via-cinema-card to-amber-950/30 p-5 shadow-gold-glow">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20 text-gold border border-gold/40 shadow-inner">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Upgrade to ReelQuest PRO VIP ($3.00/mo)</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Unlock Unlimited Otara hints, Custom Graph sandbox, Golden VIP avatar glow, and permanent Streak Shield protection.
                  </p>
                </div>
              </div>

              <button
                onClick={onOpenPro}
                className="shrink-0 rounded-xl bg-gold px-5 py-2.5 text-xs font-black text-cinema-black hover:opacity-90 shadow-gold-glow transition active:scale-95"
              >
                Unlock Pro ($3/mo)
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
      {/* TAB 4: PRO & BILLING (PRODUCTION $3/MO, REAL BILLING)    */}
      {/* ======================================================== */}
      {isOwnProfile && activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Notification Banner (if card updated or renewal toggled) */}
          {billingNotice && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
              billingNotice.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : billingNotice.type === 'error'
                ? 'bg-red-500/15 border-red-500/40 text-red-300'
                : billingNotice.type === 'warning'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
            }`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{billingNotice.text}</span>
            </div>
          )}

          {/* Dunning Notice (When automatic charge attempt failed) */}
          {subscription?.status === 'PAST_DUE' && subscription?.dunningNotice && (
            <div className="rounded-2xl border border-amber-500/50 bg-amber-500/10 p-5 shadow-xl space-y-2">
              <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <span>Payment Notice: Monthly $3.00 Charge Failed (Attempt {subscription.dunningNotice.attempt}/3)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                We were unable to charge your saved card for this billing cycle. A warning notification has been sent to <strong>{profileUser.email}</strong>.
                An automatic retry is scheduled. If 3 consecutive attempts fail, your Pro perks will be suspended.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowCardModal(true)}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-cinema-black hover:bg-amber-400 transition"
                >
                  Update Payment Method
                </button>
              </div>
            </div>
          )}

          {/* Suspended Alert */}
          {subscription?.status === 'SUSPENDED' && (
            <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-5 shadow-xl space-y-2">
              <div className="flex items-center gap-2.5 text-red-400 font-extrabold text-sm">
                <AlertTriangle className="h-5 w-5" />
                <span>Subscription Suspended</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Your monthly Pro subscription was suspended after 3 unsuccessful payment attempts. Please provide a valid payment method below to reactivate your Pro status and resume unlimited hints and graph perks.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setShowCardModal(true)}
                  className="rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-400 transition"
                >
                  Reactivate with New Card
                </button>
              </div>
            </div>
          )}

          {/* Active Plan Overview Card */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-black p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/60 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gold">
                  Current Billing Plan
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-lg font-black text-white">ReelQuest Pro Monthly</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${
                    subscription?.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : subscription?.status === 'PAST_DUE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : subscription?.status === 'SUSPENDED'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-cinema-border text-cinema-muted border-cinema-border'
                  }`}>
                    {subscription?.status || 'INACTIVE'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline sm:justify-end gap-1">
                  <span className="text-2xl font-black text-gold">$3.00</span>
                  <span className="text-xs text-cinema-muted">/ month (Auto-Renewing)</span>
                </div>
                <span className="text-[11px] text-cinema-muted">
                  Billed monthly via Stripe recurring payments
                </span>
              </div>
            </div>

            {/* Next Billing Date & Renewal Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Next Billing Date</span>
                <span className="font-bold text-white text-sm">
                  {subscription?.currentPeriodEnd
                    ? formatMatchDate(subscription.currentPeriodEnd)
                    : 'N/A'}
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Auto-Renewal</span>
                <span className={`font-bold text-sm ${subscription?.cancelAtPeriodEnd ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {subscription?.cancelAtPeriodEnd ? 'Cancels at Period End' : 'Active (Automatic)'}
                </span>
              </div>

              <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3">
                <span className="text-[10px] uppercase font-bold text-cinema-muted block">Payment Method</span>
                <span className="font-bold text-white text-sm flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-gold" />
                  <span>
                    {subscription?.paymentMethod
                      ? `${subscription.paymentMethod.brand} •••• ${subscription.paymentMethod.last4}`
                      : 'No Card on File'}
                  </span>
                </span>
              </div>
            </div>

            {/* Actions: Cancel/Resume and Change Card */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={() => setShowCardModal(true)}
                className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/15 px-4 py-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black shadow-gold-glow/20 transition active:scale-95"
              >
                <CreditCard className="h-4 w-4" />
                <span>Update / Change Card</span>
              </button>

              {subscription?.status === 'ACTIVE' && (
                <button
                  onClick={handleToggleAutoRenew}
                  className="rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:border-cinema-muted transition"
                >
                  {subscription?.cancelAtPeriodEnd ? 'Resume Auto-Renewal' : 'Cancel Auto-Renewal'}
                </button>
              )}
            </div>
          </div>

          {/* Billing & Invoice History Table */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-cinema-border/50 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-extrabold text-white">Payment & Invoice History</h3>
              </div>
              <span className="text-[10px] text-cinema-muted">
                {subscription?.invoices?.length || 0} Invoices Recorded
              </span>
            </div>

            {subscription?.invoices && subscription.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-cinema-border/60 text-cinema-muted text-[10px] uppercase font-bold">
                      <th className="py-2.5 px-3">Invoice ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cinema-border/40">
                    {subscription.invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-cinema-surface/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-300">{inv.id}</td>
                        <td className="py-3 px-3 text-slate-300">{formatMatchDate(inv.date)}</td>
                        <td className="py-3 px-3 font-semibold text-white">{inv.description}</td>
                        <td className="py-3 px-3 font-mono font-extrabold text-gold">{inv.amount}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}>
                            {inv.status === 'PAID' ? <Check className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => alert(`ReelQuest Electronic Receipt\nInvoice: ${inv.id}\nDate: ${inv.date}\nAmount: ${inv.amount}\nStatus: ${inv.status}\nCustomer: ${profileUser.email}`)}
                            className="text-[11px] font-bold text-gold hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-cinema-muted">
                No past invoices found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: EDIT PROFILE & AVATAR (STRICTLY ENGLISH LABELS)    */}
      {/* ======================================================== */}
      {isOwnProfile && activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Custom Avatar Upload Section */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cinema-border/60 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Camera className="h-4 w-4 text-gold" />
                  <span>Custom Profile Picture</span>
                </h3>
                <p className="text-xs text-cinema-muted mt-0.5">
                  Upload your own photo (PNG, JPG, WebP) or pick from our curated cinema avatars below.
                </p>
              </div>

              {customAvatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCustomAvatar}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Custom Photo</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Box */}
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-gold shadow-gold-glow bg-black/60 overflow-hidden">
                {customAvatarUrl ? (
                  <img
                    src={customAvatarUrl}
                    alt="Custom Avatar Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-cinema-muted">
                    <User className="h-8 w-8 mx-auto opacity-50" />
                    <span className="text-[9px] block mt-1">No Custom Photo</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cinema-surface border border-cinema-border hover:border-gold px-4 py-2.5 text-xs font-bold text-white transition active:scale-95"
                >
                  <Upload className="h-4 w-4 text-gold" />
                  <span>{customAvatarUrl ? 'Change Custom Photo' : 'Upload Custom Photo'}</span>
                </button>

                <p className="text-[11px] text-cinema-muted">
                  Square 1:1 image recommended. Auto-cropped & optimized. Maximum file size: 8MB.
                </p>

                {uploadError && (
                  <p className="text-xs font-bold text-red-400">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preset Avatar Selector Grid */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>Or Choose a Preset Cinema Persona</span>
                <span className="text-xs font-normal text-cinema-muted">({CINEMA_AVATARS.length} Curated Personas)</span>
              </h3>
              <p className="text-xs text-cinema-muted mt-0.5">
                Active when custom photo is not applied.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CINEMA_AVATARS.map(av => {
                const isSelected = !customAvatarUrl && editAvatarId === av.id;
                return (
                  <button
                    type="button"
                    key={av.id}
                    onClick={() => {
                      setEditAvatarId(av.id);
                      setCustomAvatarUrl(null);
                    }}
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

          {/* Profile Details Inputs: Strictly English, Searchable Sovereign Country */}
          <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-extrabold text-white">Personal Information & Cinephile Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  maxLength={30}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="e.g. John"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  maxLength={40}
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3.5 py-2.5 text-xs text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                  placeholder="e.g. Smith"
                />
              </div>

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

              {/* Searchable Sovereign Country Dropdown */}
              <div>
                <CountrySelect
                  value={editCountryCode}
                  onChange={setEditCountryCode}
                  label="Nationality"
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

              <div className="sm:col-span-2">
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

      {/* Card Update Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-gold/40 bg-gradient-to-b from-cinema-card to-cinema-surface p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setShowCardModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <CreditCard className="h-5 w-5 text-gold" />
              <h3 className="text-base font-black text-white">Update Payment Method</h3>
            </div>
            <p className="text-xs text-cinema-muted">
              Add a new credit or debit card for your monthly $3.00 Pro subscription.
            </p>

            <form onSubmit={handleUpdateCardSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="John Smith"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Card Number (16 Digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
                    setCardNumber(val);
                  }}
                  placeholder="4242 4242 4242 4242"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-mono text-white placeholder-cinema-muted outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={cardExp}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                      setCardExp(val);
                    }}
                    placeholder="12/28"
                    className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-mono text-white placeholder-cinema-muted outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    CVC (3 Digits)
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                    placeholder="888"
                    className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-mono text-white placeholder-cinema-muted outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="rounded-xl border border-cinema-border bg-cinema-surface px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gold px-5 py-2 text-xs font-black text-cinema-black hover:opacity-90 shadow-gold-glow"
                >
                  Save New Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
