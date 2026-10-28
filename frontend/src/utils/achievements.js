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
  { id: 'spotle', label: 'Spotle' },
  { id: 'frame-sleuth', label: 'Frame Sleuth' },
  { id: 'box-office', label: 'Box Office' },
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
      return (won >= 1 || (stats?.gamesWon || 0) > 0) ? 1 : 0;
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
      if (match) return 1;
      if ((stats?.gamesWon || 0) > 0 && stats.bestHops && stats.bestHops <= 2 && stats.bestHops > 0) {
        return 1;
      }
      return 0;
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
      if (matches.length > 0) return Math.min(5, matches.length);
      if ((stats?.gamesWon || 0) >= 5 && stats.bestHops && stats.bestHops <= 2 && stats.bestHops > 0) {
        return 5;
      }
      return 0;
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
      const match = history.find(m => m.gameMode === 'six-degrees' && m.won && m.undos === 0 && m.hops > 0);
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
  // SPOTLE (Daily Cinema Mystery)
  // ==========================================
  {
    id: 'spotle_first_solved',
    gameMode: 'spotle',
    title: 'First Clue Unlocked',
    description: 'Solve your first Spotle daily mystery movie.',
    tier: 'bronze',
    icon: 'Film',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'spotle' && m.won).length;
      return won >= 1 ? 1 : 0;
    }
  },
  {
    id: 'spotle_sleuth_3',
    gameMode: 'spotle',
    title: 'Cinema Sleuth',
    description: 'Deduce the mystery movie in 3 guesses or fewer.',
    tier: 'gold',
    icon: 'Target',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'spotle' && m.won && m.hops <= 3 && m.hops > 0);
      return match ? 1 : 0;
    }
  },
  {
    id: 'spotle_one_shot',
    gameMode: 'spotle',
    title: 'The Prophecy (One-Shot)',
    description: 'Guess the secret mystery movie on your very first try!',
    tier: 'diamond',
    icon: 'Crown',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'spotle' && m.won && m.hops === 1);
      return match ? 1 : 0;
    }
  },
  {
    id: 'spotle_streak_3',
    gameMode: 'spotle',
    title: 'Daily Detective',
    description: 'Solve 3 Spotle challenges in total.',
    tier: 'silver',
    icon: 'Sparkles',
    maxProgress: 3,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'spotle' && m.won).length;
      return Math.min(3, won);
    }
  },
  {
    id: 'spotle_archivist_pro',
    gameMode: 'spotle',
    title: 'Hollywood Archivist (PRO)',
    description: 'Rewind the days and solve 5 archive Spotle challenges.',
    tier: 'gold',
    icon: 'History',
    maxProgress: 5,
    checkProgress: (stats, history) => {
      const wonArchive = history.filter(m => m.gameMode === 'spotle' && m.won && m.subMode === 'archive').length;
      return Math.min(5, wonArchive);
    }
  },

  // ==========================================
  // FRAME SLEUTH (Visual Frame Deduction)
  // ==========================================
  {
    id: 'frame_first_solved',
    gameMode: 'frame-sleuth',
    title: 'Eagle Eye',
    description: 'Solve your first Frame Sleuth mystery challenge.',
    tier: 'bronze',
    icon: 'Camera',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'frame-sleuth' && m.won).length;
      return won >= 1 ? 1 : 0;
    }
  },
  {
    id: 'frame_single_shot',
    gameMode: 'frame-sleuth',
    title: 'Master of Mise-en-scène',
    description: 'Identify the secret movie on Frame #1 (first attempt)!',
    tier: 'diamond',
    icon: 'Crown',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'frame-sleuth' && m.won && (m.framesUsed === 1 || m.hops === 1));
      return match ? 1 : 0;
    }
  },
  {
    id: 'frame_rapid_focus',
    gameMode: 'frame-sleuth',
    title: "Cinematographer's Intuition",
    description: 'Guess the movie on Frame 2 or 3 without reaching the main character clues.',
    tier: 'silver',
    icon: 'Target',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'frame-sleuth' && m.won && (m.framesUsed <= 3 || m.hops <= 3) && (m.framesUsed > 1 || m.hops > 1));
      return match ? 1 : 0;
    }
  },
  {
    id: 'frame_streak_3',
    gameMode: 'frame-sleuth',
    title: 'Sharp Focus Detective',
    description: 'Solve 3 Frame Sleuth daily challenges.',
    tier: 'silver',
    icon: 'Sparkles',
    maxProgress: 3,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'frame-sleuth' && m.won).length;
      return Math.min(3, won);
    }
  },
  {
    id: 'frame_archivist_pro',
    gameMode: 'frame-sleuth',
    title: 'Film Vault Inspector (PRO)',
    description: 'Rewind time and solve 5 past Archive frame challenges.',
    tier: 'gold',
    icon: 'History',
    maxProgress: 5,
    checkProgress: (stats, history) => {
      const wonArchive = history.filter(m => m.gameMode === 'frame-sleuth' && m.won && m.subMode === 'archive').length;
      return Math.min(5, wonArchive);
    }
  },
  {
    id: 'frame_master_10',
    gameMode: 'frame-sleuth',
    title: 'Visual Auteur',
    description: 'Conquer 10 Frame Sleuth challenges across daily and archive.',
    tier: 'gold',
    icon: 'Award',
    maxProgress: 10,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'frame-sleuth' && m.won).length;
      return Math.min(10, won);
    }
  },

  // ==========================================
  // BOX OFFICE CLASH (Higher or Lower)
  // ==========================================
  {
    id: 'bo_first_clash',
    gameMode: 'box-office',
    title: 'First Ticket Sold',
    description: 'Win your first Box Office Clash streak or daily round.',
    tier: 'bronze',
    icon: 'TrendingUp',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const won = history.filter(m => m.gameMode === 'box-office' && (m.won || (m.hops && m.hops > 0))).length;
      return won >= 1 ? 1 : 0;
    }
  },
  {
    id: 'bo_streak_5',
    gameMode: 'box-office',
    title: 'Rising Producer',
    description: 'Reach a streak of 5 correct matchups in Endless Streak mode.',
    tier: 'silver',
    icon: 'Flame',
    maxProgress: 5,
    checkProgress: (stats, history) => {
      const maxStreak = history
        .filter(m => m.gameMode === 'box-office' && m.subMode === 'streak')
        .reduce((max, m) => Math.max(max, m.hops || 0), 0);
      return Math.min(5, maxStreak);
    }
  },
  {
    id: 'bo_streak_10',
    gameMode: 'box-office',
    title: 'Studio Executive',
    description: 'Reach a formidable streak of 10 in Endless Streak mode.',
    tier: 'gold',
    icon: 'Crown',
    maxProgress: 10,
    checkProgress: (stats, history) => {
      const maxStreak = history
        .filter(m => m.gameMode === 'box-office' && m.subMode === 'streak')
        .reduce((max, m) => Math.max(max, m.hops || 0), 0);
      return Math.min(10, maxStreak);
    }
  },
  {
    id: 'bo_streak_20',
    gameMode: 'box-office',
    title: 'Hollywood Mogul',
    description: 'Conquer a legendary 20-match streak in Endless Streak mode!',
    tier: 'diamond',
    icon: 'Crown',
    maxProgress: 20,
    checkProgress: (stats, history) => {
      const maxStreak = history
        .filter(m => m.gameMode === 'box-office' && m.subMode === 'streak')
        .reduce((max, m) => Math.max(max, m.hops || 0), 0);
      return Math.min(20, maxStreak);
    }
  },
  {
    id: 'bo_daily_perfect',
    gameMode: 'box-office',
    title: 'Flawless Forecast',
    description: 'Achieve a perfect 5/5 score in any Daily Box Office challenge.',
    tier: 'gold',
    icon: 'Target',
    maxProgress: 1,
    checkProgress: (stats, history) => {
      const match = history.find(m => m.gameMode === 'box-office' && m.subMode === 'daily' && m.hops === 5);
      return match ? 1 : 0;
    }
  },
  {
    id: 'bo_daily_streak_3',
    gameMode: 'box-office',
    title: 'Consistent Investor',
    description: 'Successfully complete 3 Daily Box Office Challenges.',
    tier: 'silver',
    icon: 'Calendar',
    maxProgress: 3,
    checkProgress: (stats, history) => {
      const count = history.filter(m => m.gameMode === 'box-office' && m.subMode === 'daily' && m.won).length;
      return Math.min(3, count);
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
  const effectiveUserId = userId || 'guest';
  const storedUnlocked = getStoredUnlockedAchievements(effectiveUserId);
  const updatedUnlocked = { ...storedUnlocked };
  const newlyUnlocked = [];

  const totalGamesCount = Math.max(stats?.gamesPlayed || 0, matchHistory.length);
  const totalWinsCount = Math.max(stats?.gamesWon || 0, matchHistory.filter(m => m.won).length);

  // If a user has NEVER played any games, prune any erroneously saved game achievements
  if (totalGamesCount === 0) {
    let pruned = false;
    for (const key of Object.keys(updatedUnlocked)) {
      if (key.startsWith('otara_') || key.startsWith('duel_') || key.startsWith('spotle_') || key.startsWith('frame_') || key.startsWith('bo_') || key.startsWith('meta_streak') || key.startsWith('meta_veteran')) {
        delete updatedUnlocked[key];
        delete storedUnlocked[key];
        pruned = true;
      }
    }
    if (pruned) {
      try {
        const storageKey = `${UNLOCKED_STORAGE_PREFIX}${effectiveUserId}`;
        localStorage.setItem(storageKey, JSON.stringify(updatedUnlocked));
      } catch (e) {}
    }
  }

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

    // A game achievement can ONLY be unlocked if the user has actually played games!
    const requiresGames = ach.gameMode === 'six-degrees' || ach.gameMode === 'duels' || ach.gameMode === 'spotle' || ach.gameMode === 'frame-sleuth' || ach.gameMode === 'box-office' || ach.id.includes('streak') || ach.id.includes('veteran');
    let isNowUnlocked = false;

    if (ach.isComingSoon) {
      isNowUnlocked = false;
      progress = 0;
    } else if (requiresGames && totalGamesCount === 0) {
      isNowUnlocked = false;
      progress = 0;
    } else {
      isNowUnlocked = isAlreadyUnlocked || (progress >= ach.maxProgress);
    }

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
