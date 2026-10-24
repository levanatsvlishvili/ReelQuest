/**
 * ReelQuest Achievements & Trophy Cabinet Engine
 * Categorized by Game Mode (Beat Otara, 1v1 Duels, Streaks & Meta, and Future Games)
 */

export const ACHIEVEMENT_TIERS = {
  bronze: {
    name: 'Bronze',
    points: 10,
    textColor: 'text-amber-500',
    borderColor: 'border-amber-600/40',
    bgGradient: 'from-amber-950/40 via-amber-900/20 to-black/60',
    badgeBg: 'bg-amber-600/20 text-amber-400 border border-amber-600/30',
    glowColor: 'shadow-[0_0_15px_rgba(217,119,6,0.25)]'
  },
  silver: {
    name: 'Silver',
    points: 25,
    textColor: 'text-slate-200',
    borderColor: 'border-slate-400/50',
    bgGradient: 'from-slate-800/40 via-slate-700/20 to-black/60',
    badgeBg: 'bg-slate-300/20 text-slate-200 border border-slate-300/30',
    glowColor: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]'
  },
  gold: {
    name: 'Gold',
    points: 50,
    textColor: 'text-gold',
    borderColor: 'border-gold/50',
    bgGradient: 'from-yellow-950/50 via-amber-900/25 to-black/60',
    badgeBg: 'bg-gold/20 text-gold border border-gold/40',
    glowColor: 'shadow-gold-glow'
  },
  diamond: {
    name: 'Diamond',
    points: 100,
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-400/60',
    bgGradient: 'from-cyan-950/50 via-sky-900/25 to-black/60',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    glowColor: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]'
  }
};

export const GAME_MODE_FILTERS = [
  { id: 'all', label: 'All Modes' },
  { id: 'six-degrees', label: 'Beat Otara' },
  { id: 'duels', label: '1v1 Duels' },
  { id: 'meta', label: 'Streaks & Meta' },
  { id: 'upcoming', label: 'Coming Soon' }
];

export const ACHIEVEMENTS = [
  // ==========================================
  // BEAT OTARA (Six Degrees of Cinema)
  // ==========================================
  {
    id: 'otara_first_link',
    gameMode: 'six-degrees',
    title: 'The First Connection',
    description: 'Complete your first successful Hollywood connection to Beat Otara.',
    tier: 'bronze',
    icon: 'Footprints',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'six-degrees' && m.won).length;
      return won >= 1 ? 1 : (stats.gamesWon > 0 ? 1 : 0);
    }
  },
  {
    id: 'otara_oracle_equal',
    gameMode: 'six-degrees',
    title: "Oracle's Equal",
    description: "Match Otara's optimal par in any Daily or Archive challenge.",
    tier: 'silver',
    icon: 'Target',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'six-degrees' && m.won && m.matchedOtara);
      return match ? 1 : (stats.bestHops && stats.bestHops <= 2 ? 1 : 0);
    }
  },
  {
    id: 'otara_nemesis',
    gameMode: 'six-degrees',
    title: "Otara's Nemesis",
    description: "Match or beat Otara's optimal path in 5 different challenges.",
    tier: 'gold',
    icon: 'Crown',
    maxProgress: 5,
    checkProgress: (stats, history) => {
      const matches = history.filter(m => m.gameMode === 'six-degrees' && m.won && m.matchedOtara);
      return Math.min(5, Math.max(matches.length, (stats.gamesWon >= 5 && stats.bestHops <= 2) ? 5 : 0));
    }
  },
  {
    id: 'otara_speed_demon',
    gameMode: 'six-degrees',
    title: 'Speed Cinephile',
    description: 'Solve a Beat Otara challenge in under 45 seconds.',
    tier: 'silver',
    icon: 'Clock',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'six-degrees' && m.won && m.durationSeconds > 0 && m.durationSeconds <= 45);
      return match ? 1 : 0;
    }
  },
  {
    id: 'otara_pure_director',
    gameMode: 'six-degrees',
    title: 'Flawless Take',
    description: 'Direct a movie chain straight to the target star with 0 undos or backtracks.',
    tier: 'gold',
    icon: 'Film',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'six-degrees' && m.won && m.undos === 0);
      return match ? 1 : 0;
    }
  },
  {
    id: 'otara_archive_traveler',
    gameMode: 'six-degrees',
    title: 'Time Machine',
    description: 'Travel into the past and solve 3 previous Archive challenges.',
    tier: 'silver',
    icon: 'History',
    maxProgress: 3,
    checkProgress: (stats, history) => {
      const matches = history.filter(m => m.gameMode === 'six-degrees' && m.won && m.subMode === 'archive');
      return Math.min(3, matches.length);
    }
  },
  {
    id: 'otara_oracle_whisper',
    gameMode: 'six-degrees',
    title: "Oracle's Whisper",
    description: "Consult Otara for a Cinephile Hint and successfully bridge the connection.",
    tier: 'bronze',
    icon: 'Sparkles',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.won && m.usedHint);
      return match ? 1 : 0;
    }
  },
  {
    id: 'otara_deep_virtuoso',
    gameMode: 'six-degrees',
    title: 'Cinema Virtuoso',
    description: 'Complete an epic Hollywood chain requiring 4 or more degrees of separation.',
    tier: 'diamond',
    icon: 'Trophy',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'six-degrees' && m.won && m.hops >= 4);
      return match ? 1 : 0;
    }
  },

  // ==========================================
  // 1v1 ONLINE DUELS
  // ==========================================
  {
    id: 'duel_gladiator_rises',
    gameMode: 'duels',
    title: 'Gladiator Rises',
    description: 'Complete your first live 1v1 online duel in the Arena.',
    tier: 'bronze',
    icon: 'Swords',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const duels = history.filter(m => m.gameMode === 'duels');
      return duels.length >= 1 ? 1 : 0;
    }
  },
  {
    id: 'duel_arena_champion',
    gameMode: 'duels',
    title: 'Arena Champion',
    description: 'Outsmart your opponents and win 3 head-to-head duels.',
    tier: 'gold',
    icon: 'Trophy',
    maxProgress: 3,
    checkProgress: (stats, history) => {
      const wins = history.filter(m => m.gameMode === 'duels' && m.won);
      return Math.min(3, wins.length);
    }
  },
  {
    id: 'duel_lightning_strike',
    gameMode: 'duels',
    title: 'Lightning Duelist',
    description: 'Conquer a 1v1 online duel in under 35 seconds.',
    tier: 'silver',
    icon: 'Zap',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const win = history.find(m => m.gameMode === 'duels' && m.won && m.durationSeconds > 0 && m.durationSeconds <= 35);
      return win ? 1 : 0;
    }
  },
  {
    id: 'duel_master_par',
    gameMode: 'duels',
    title: 'Arena Grandmaster',
    description: "Win a 1v1 duel while also matching Otara's optimal par path.",
    tier: 'diamond',
    icon: 'Crown',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const win = history.find(m => m.gameMode === 'duels' && m.won && m.matchedOtara);
      return win ? 1 : 0;
    }
  },

  // ==========================================
  // STREAKS & META (Global Mastery)
  // ==========================================
  {
    id: 'meta_streak_3',
    gameMode: 'meta',
    title: 'Cinephile Habit',
    description: 'Forge a 3-day consecutive Daily Challenge streak.',
    tier: 'bronze',
    icon: 'Flame',
    maxProgress: 3,
    checkProgress: (stats) => Math.min(3, stats.streak || 0)
  },
  {
    id: 'meta_streak_7',
    gameMode: 'meta',
    title: 'Weekly Headliner',
    description: 'Achieve a stellar 7-day Daily Challenge streak.',
    tier: 'silver',
    icon: 'Flame',
    maxProgress: 7,
    checkProgress: (stats) => Math.min(7, stats.streak || 0)
  },
  {
    id: 'meta_streak_30',
    gameMode: 'meta',
    title: 'Criterion Legend',
    description: 'Build a monumental 30-day Daily Challenge streak.',
    tier: 'diamond',
    icon: 'Crown',
    maxProgress: 30,
    checkProgress: (stats) => Math.min(30, stats.streak || 0)
  },
  {
    id: 'meta_veteran_25',
    gameMode: 'meta',
    title: 'Silver Screen Veteran',
    description: 'Play 25 matches across any ReelQuest game mode.',
    tier: 'gold',
    icon: 'Award',
    maxProgress: 25,
    checkProgress: (stats, history) => {
      const count = Math.max(stats.gamesPlayed || 0, history.length);
      return Math.min(25, count);
    }
  },
  {
    id: 'meta_pro_patron',
    gameMode: 'meta',
    title: "Director's Guild VIP",
    description: 'Become a ReelQuest Pro patron to access unlimited hints and features.',
    tier: 'gold',
    icon: 'Crown',
    maxProgress: 1,
    checkProgress: (stats, history, user) => (user?.isPro ? 1 : 0)
  },

  // ==========================================
  // UPCOMING GAMES (Extensible Stubs)
  // ==========================================
  {
    id: 'future_quoted_first',
    gameMode: 'upcoming',
    title: "Quote'd: First Take",
    description: "Identify 5 iconic movie quotes on the first audio listen.",
    tier: 'silver',
    icon: 'Sparkles',
    maxProgress: 5,
    isComingSoon: true,
    comingSoonTag: "Quote'd Mode",
    checkProgress: () => 0
  },
  {
    id: 'future_plot_detective',
    gameMode: 'upcoming',
    title: 'Plot Mystery Sleuth',
    description: 'Crack 10 cryptic plot synopses in the upcoming Plot Guesser game.',
    tier: 'silver',
    icon: 'Sparkles',
    maxProgress: 10,
    isComingSoon: true,
    comingSoonTag: 'Plot Guesser',
    checkProgress: () => 0
  },
  {
    id: 'future_boxoffice_tycoon',
    gameMode: 'upcoming',
    title: 'Box Office Tycoon',
    description: 'Forecast 10 opening weekend box office clashes accurately.',
    tier: 'gold',
    icon: 'Sparkles',
    maxProgress: 10,
    isComingSoon: true,
    comingSoonTag: 'Box Office Clash',
    checkProgress: () => 0
  }
];

const UNLOCKED_STORAGE_PREFIX = 'reelquest_unlocked_achievements_';

/**
 * Returns stored unlocked achievements map for the user.
 */
export function getStoredUnlockedAchievements(userId) {
  const effectiveUserId = userId || 'guest';
  const storageKey = `${UNLOCKED_STORAGE_PREFIX}${effectiveUserId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Evaluates all achievements against user stats and match history.
 * Persists any newly unlocked achievements with an unlock timestamp.
 */
export function evaluateAchievements(userId, user, stats = {}, matchHistory = []) {
  const storedUnlocked = getStoredUnlockedAchievements(userId);
  const updatedUnlocked = { ...storedUnlocked };
  const newlyUnlocked = [];

  const evaluated = ACHIEVEMENTS.map(ach => {
    const isAlreadyUnlocked = Boolean(storedUnlocked[ach.id]);
    let progress = 0;

    if (ach.isComingSoon) {
      progress = 0;
    } else {
      try {
        progress = ach.checkProgress(stats, matchHistory, user);
      } catch {
        progress = 0;
      }
    }

    const isNowUnlocked = isAlreadyUnlocked || (progress >= ach.maxProgress && !ach.isComingSoon);

    let unlockedAt = storedUnlocked[ach.id]?.unlockedAt || null;

    if (isNowUnlocked && !isAlreadyUnlocked) {
      unlockedAt = new Date().toISOString();
      updatedUnlocked[ach.id] = { unlockedAt };
      newlyUnlocked.push({ ...ach, unlockedAt });
    }

    return {
      ...ach,
      progress: Math.min(progress, ach.maxProgress),
      isUnlocked: isNowUnlocked,
      unlockedAt
    };
  });

  // Save updated unlock states if new unlocks occurred
  if (newlyUnlocked.length > 0) {
    const effectiveUserId = userId || 'guest';
    const storageKey = `${UNLOCKED_STORAGE_PREFIX}${effectiveUserId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedUnlocked));
    } catch (e) {
      console.warn('Failed to persist achievement unlocks:', e);
    }
  }

  // Calculate trophy stats
  const activeAchievements = evaluated.filter(a => !a.isComingSoon);
  const unlockedCount = activeAchievements.filter(a => a.isUnlocked).length;
  const totalCount = activeAchievements.length;
  const totalPoints = evaluated
    .filter(a => a.isUnlocked)
    .reduce((sum, a) => sum + (ACHIEVEMENT_TIERS[a.tier]?.points || 0), 0);

  return {
    achievements: evaluated,
    newlyUnlocked,
    unlockedCount,
    totalCount,
    totalPoints,
    completionPercentage: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0
  };
}
