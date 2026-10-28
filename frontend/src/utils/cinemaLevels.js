/**
 * Cinema Level, XP Progression, and Avatar System for ReelQuest
 */

// 12 Preset Cinema Avatars
export const CINEMA_AVATARS = [
  {
    id: 'avatar-director',
    name: 'The Director',
    emoji: '🎬',
    title: 'Auteur Visionary',
    bgGradient: 'from-amber-600/30 to-amber-900/40 border-amber-500/50 text-amber-300',
    description: 'Mastermind behind the camera calling the shots.'
  },
  {
    id: 'avatar-noir',
    name: 'Noir Detective',
    emoji: '🕵️',
    title: 'Shadow Sleuth',
    bgGradient: 'from-slate-700/40 to-zinc-900/50 border-slate-500/50 text-slate-200',
    description: 'Fedora, cigarette smoke, and solving cold Hollywood mysteries.'
  },
  {
    id: 'avatar-scifi',
    name: 'Cyber Cinephile',
    emoji: '🕶️',
    title: 'Matrix Navigator',
    bgGradient: 'from-cyan-600/30 to-blue-900/40 border-cyan-500/50 text-cyan-300',
    description: 'Bent on simulated realities, dystopias, and neon lights.'
  },
  {
    id: 'avatar-popcorn',
    name: 'Front Row Critic',
    emoji: '🍿',
    title: 'Midnight Premiere VIP',
    bgGradient: 'from-red-600/30 to-rose-900/40 border-rose-500/50 text-rose-300',
    description: 'First in line with large buttery popcorn and 3D glasses.'
  },
  {
    id: 'avatar-gold',
    name: 'Oscar Winner',
    emoji: '🏆',
    title: 'Academy Legend',
    bgGradient: 'from-yellow-600/30 to-amber-900/50 border-gold/60 text-gold',
    description: 'Statuette in hand, thanking the Academy and cast.'
  },
  {
    id: 'avatar-horror',
    name: 'Gothic Master',
    emoji: '🧛',
    title: 'Creature of the Night',
    bgGradient: 'from-purple-900/40 to-black/60 border-purple-500/50 text-purple-300',
    description: 'Thrives on tension, shadows, jump-scares, and practical FX.'
  },
  {
    id: 'avatar-animation',
    name: 'Animation Maestro',
    emoji: '🎨',
    title: 'Frame Illusionist',
    bgGradient: 'from-pink-600/30 to-rose-900/40 border-pink-500/50 text-pink-300',
    description: 'Breathing soul into 24 drawn frames per second.'
  },
  {
    id: 'avatar-western',
    name: 'Desert Drifter',
    emoji: '🤠',
    title: 'Spaghetti Gunfighter',
    bgGradient: 'from-orange-700/30 to-amber-950/40 border-orange-500/50 text-orange-300',
    description: 'A fistful of dollars, squinted eyes, and Ennio Morricone chords.'
  },
  {
    id: 'avatar-interstellar',
    name: 'Cosmic Pilot',
    emoji: '🚀',
    title: 'Horizon Seeker',
    bgGradient: 'from-indigo-600/30 to-purple-900/40 border-indigo-500/50 text-indigo-300',
    description: 'Exploring gargantuan black holes and relativistic time travel.'
  },
  {
    id: 'avatar-otara',
    name: 'Otara Devotee',
    emoji: '👑',
    title: 'Oracle’s Disciple',
    bgGradient: 'from-gold/30 to-amber-900/50 border-gold text-gold shadow-gold-glow',
    description: 'Devoted disciple of Otara, solving shortest cinema connections.'
  },
  {
    id: 'avatar-archivist',
    name: 'Film Archivist',
    emoji: '🎞️',
    title: 'Nitrate Preserver',
    bgGradient: 'from-emerald-700/30 to-teal-950/40 border-emerald-500/50 text-emerald-300',
    description: 'Preserving rare 35mm film reels and silent era gems.'
  },
  {
    id: 'avatar-hero',
    name: 'Action Hero',
    emoji: '⚡',
    title: 'Blockbuster Dynamo',
    bgGradient: 'from-blue-600/30 to-indigo-900/40 border-blue-500/50 text-blue-300',
    description: 'Walking away in slow motion while explosions ignite behind.'
  }
];

export function getAvatarById(avatarId) {
  return CINEMA_AVATARS.find(a => a.id === avatarId) || CINEMA_AVATARS[0];
}

// Level Progression Titles & XP thresholds
const LEVEL_TIERS = [
  { minLevel: 50, title: 'Legendary Auteur', badgeColor: 'bg-gold/20 text-gold border-gold/40' },
  { minLevel: 35, title: 'Executive Producer', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { minLevel: 25, title: 'Festival Laureate', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  { minLevel: 15, title: 'Assistant Director', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { minLevel: 10, title: 'Film Critic', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { minLevel: 5, title: 'Projectionist', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { minLevel: 1, title: 'Ticket Taker', badgeColor: 'bg-slate-700/40 text-slate-300 border-slate-600/40' }
];

/**
 * Calculates XP and Level from user match history and stats
 */
export function calculateCinemaLevel(stats = {}, matchHistory = []) {
  let xp = 0;

  // 1. Matches XP
  matchHistory.forEach(m => {
    if (m.won) {
      if (m.gameMode === 'six-degrees') {
        xp += 100;
        if (m.matchedOtara) xp += 50;
      } else if (m.gameMode === 'spotle') {
        xp += 80;
        if (m.hops && m.hops <= 3) xp += 70;
      } else if (m.gameMode === 'frame-sleuth') {
        xp += 80;
        if (m.hops === 1 || m.framesUsed === 1) xp += 120;
      } else if (m.gameMode === 'box-office') {
        xp += 25 * Math.min(10, m.hops || 1);
        if (m.subMode === 'daily' && m.hops === 5) xp += 100;
      } else {
        xp += 60;
      }
    } else {
      // Small consolation XP for playing
      xp += 20;
    }
  });

  // 2. Streaks XP
  const streak = stats.streak || 0;
  xp += streak * 50;

  // 3. User total score from server/stats
  if (stats.totalScore) {
    xp += Math.round(stats.totalScore * 0.5);
  }

  // Ensure minimum XP
  xp = Math.max(0, xp);

  // Calculate Level: Each level requires approx (Level * 250) XP
  // Total XP to reach level L = 125 * L * (L - 1)
  let level = 1;
  while (true) {
    const xpForNext = 125 * (level + 1) * level;
    if (xp >= xpForNext && level < 100) {
      level++;
    } else {
      break;
    }
  }

  const prevLevelXp = 125 * level * (level - 1);
  const nextLevelXp = 125 * (level + 1) * level;
  const currentLevelProgressXp = xp - prevLevelXp;
  const neededForNext = nextLevelXp - prevLevelXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelProgressXp / neededForNext) * 100)));

  const tier = LEVEL_TIERS.find(t => level >= t.minLevel) || LEVEL_TIERS[LEVEL_TIERS.length - 1];

  // Streak Shield & Bonanza status
  const streakShieldActive = Boolean(stats.isPro || streak >= 7);
  const streakMultiplier = streak >= 5 ? 1.5 : 1.0;

  return {
    level,
    title: tier.title,
    badgeColor: tier.badgeColor,
    totalXp: xp,
    currentLevelProgressXp,
    neededForNext,
    progressPercent,
    streakShieldActive,
    streakMultiplier
  };
}

/**
 * Builds a 365-day (52 weeks) activity matrix for the GitHub-style contribution calendar
 */
export function buildActivityHeatmapData(matchHistory = []) {
  // Map of date string YYYY-MM-DD -> { count, wins }
  const countsByDate = new Map();

  matchHistory.forEach(m => {
    const d = m.date || (m.timestamp ? m.timestamp.slice(0, 10) : null);
    if (d) {
      const existing = countsByDate.get(d) || { count: 0, wins: 0 };
      existing.count += 1;
      if (m.won) existing.wins += 1;
      countsByDate.set(d, existing);
    }
  });

  // Generate 52 weeks back from today
  const today = new Date();
  const days = [];
  const totalDays = 364; // 52 weeks * 7

  for (let i = totalDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayData = countsByDate.get(dateStr) || { count: 0, wins: 0 };

    // Activity intensity level: 0 to 4
    let level = 0;
    if (dayData.count === 1) level = 1;
    else if (dayData.count === 2) level = 2;
    else if (dayData.count === 3) level = 3;
    else if (dayData.count >= 4) level = 4;

    days.push({
      dateStr,
      date: d,
      count: dayData.count,
      wins: dayData.wins,
      level,
      weekday: d.getDay(), // 0 = Sunday, 1 = Monday, etc.
      formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
  }

  // Group into weeks (columns)
  const weeks = [];
  let currentWeek = [];

  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const totalMatchesYear = Array.from(countsByDate.values()).reduce((sum, item) => sum + item.count, 0);
  const activeDaysCount = Array.from(countsByDate.values()).filter(item => item.count > 0).length;

  return {
    weeks,
    totalMatchesYear,
    activeDaysCount
  };
}
