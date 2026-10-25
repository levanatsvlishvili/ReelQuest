import { getAdminToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Default Curated Actor Pool for live search and verification
const DEFAULT_ACTORS = [
  { id: '31', name: 'Tom Hanks', profilePath: '/oFvZoKI6lvU03n4YoNGAll9rkas.jpg', knownFor: 'Forrest Gump, Cast Away' },
  { id: '6193', name: 'Leonardo DiCaprio', profilePath: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', knownFor: 'Inception, Titanic' },
  { id: '2037', name: 'Cillian Murphy', profilePath: '/36LnzGM2FebRH7CP6AcWIIFtAc5.jpg', knownFor: 'Oppenheimer, Peaky Blinders' },
  { id: '234352', name: 'Margot Robbie', profilePath: '/euDPyqLnuUMBGxEFXZhiFu04AbU.jpg', knownFor: 'Barbie, The Wolf of Wall Street' },
  { id: '3896', name: 'Christian Bale', profilePath: '/qCpZn2e3nWw2SaIxQ8ZOrLQcuuv.jpg', knownFor: 'The Dark Knight, American Psycho' },
  { id: '1892', name: 'Matt Damon', profilePath: '/elSlNgV8xVifsbHpFsqravxY4Tw.jpg', knownFor: 'The Martian, Good Will Hunting' },
  { id: '287', name: 'Brad Pitt', profilePath: '/cckcYc2v0yh1tc9QjRelptsqRJ4.jpg', knownFor: 'Fight Club, Once Upon a Time in Hollywood' },
  { id: '1245', name: 'Scarlett Johansson', profilePath: '/6NsMbJXRlDZuDzatQTsq4Py3JFw.jpg', knownFor: 'Lost in Translation, Avengers' },
  { id: '3223', name: 'Robert Downey Jr.', profilePath: '/5qHNjhtjMD4YWH3ag0SCvO8VNZ5.jpg', knownFor: 'Iron Man, Oppenheimer' },
  { id: '500', name: 'Tom Cruise', profilePath: '/8qBuzxtzgLIIYG6J2eaIe6X2cvu.jpg', knownFor: 'Top Gun, Mission: Impossible' },
  { id: '74568', name: 'Chris Hemsworth', profilePath: '/jpurPFkPe89YqqGU89egSSzz3AZ.jpg', knownFor: 'Thor, Extraction' },
  { id: '16828', name: 'Chris Evans', profilePath: '/3bOGNsHlrswhyW79uvIHH1V43JI.jpg', knownFor: 'Captain America, Knives Out' },
  { id: '1136406', name: 'Tom Holland', profilePath: '/2qhO3nvBnhVStFzRAk7bK3a8g7p.jpg', knownFor: 'Spider-Man, Uncharted' },
  { id: '5064', name: 'Meryl Streep', profilePath: '/em86e6Y72m0g5f3PzKj1x8b0s5y.jpg', knownFor: 'The Devil Wears Prada, Sophie\'s Choice' }
];

export function getTmdbImageUrl(path, size = 'w185') {
  if (!path) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

// -----------------------------------------------------------------------------
// MODULE 1: KPI METRICS
// -----------------------------------------------------------------------------
export async function fetchDashboardMetrics() {
  const token = getAdminToken();
  if (API_BASE_URL && token) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Remote admin metrics fetch failed, using stored telemetry:', e);
    }
  }

  // Realistic telemetry simulation
  return {
    dau: 142,
    todayCompletions: 98,
    completionRate: 69,
    duelsHostedToday: 34,
    proSubscribers: 27,
    mrr: '$134.73',
    dbHealth: 'OPTIMAL (4ms)',
    tmdbQuotaRemaining: '96.4%',
    streakRecord: 18,
    recentActivity: [
      { id: 1, type: 'DUEL', text: 'wero challenged lnats17 in a 1v1 Hollywood Duel', time: '5m ago' },
      { id: 2, type: 'VICTORY', text: 'Cinephile_99 beat Otara in 2 hops on today\'s puzzle', time: '14m ago' },
      { id: 3, type: 'PRO', text: 'New Pro Subscriber: geo_movie_lover upgraded ($4.99)', time: '42m ago' },
      { id: 4, type: 'ACHIEVEMENT', text: 'Cinephile_Alex unlocked "Oracle\'s Equal" badge', time: '1h ago' },
      { id: 5, type: 'AUDIT', text: 'Automated Anti-Cheat scanned 45 daily submissions (0 flagged)', time: '2h ago' }
    ]
  };
}

// -----------------------------------------------------------------------------
// MODULE 2: DAILY CHALLENGE SCHEDULER
// -----------------------------------------------------------------------------
export async function fetchScheduledChallenges() {
  const token = getAdminToken();
  if (API_BASE_URL && token) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/challenges`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  const stored = localStorage.getItem('reelquest_admin_scheduled_challenges');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }

  // Pre-seed realistic dates
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dayAfter = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
  const day3 = new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10);

  const initial = [
    {
      date: today,
      startActor: DEFAULT_ACTORS[0], // Tom Hanks
      targetActor: DEFAULT_ACTORS[1], // Leonardo DiCaprio
      optimalHops: 2,
      pathSummary: 'Tom Hanks ➔ Catch Me If You Can (2002) ➔ Leonardo DiCaprio',
      status: 'ACTIVE_TODAY'
    },
    {
      date: tomorrow,
      startActor: DEFAULT_ACTORS[2], // Cillian Murphy
      targetActor: DEFAULT_ACTORS[3], // Margot Robbie
      optimalHops: 2,
      pathSummary: 'Cillian Murphy ➔ The Dark Knight Rises ➔ Christian Bale ➔ The Big Short ➔ Margot Robbie',
      status: 'SCHEDULED'
    },
    {
      date: dayAfter,
      startActor: DEFAULT_ACTORS[4], // Christian Bale
      targetActor: DEFAULT_ACTORS[5], // Matt Damon
      optimalHops: 2,
      pathSummary: 'Christian Bale ➔ Ford v Ferrari (2019) ➔ Matt Damon',
      status: 'SCHEDULED'
    },
    {
      date: day3,
      startActor: DEFAULT_ACTORS[6], // Brad Pitt
      targetActor: DEFAULT_ACTORS[8], // Robert Downey Jr.
      optimalHops: 2,
      pathSummary: 'Brad Pitt ➔ Ocean\'s Eleven ➔ Matt Damon ➔ Oppenheimer ➔ Robert Downey Jr.',
      status: 'SCHEDULED'
    }
  ];

  localStorage.setItem('reelquest_admin_scheduled_challenges', JSON.stringify(initial));
  return initial;
}

export async function saveScheduledChallenge(challenge) {
  const token = getAdminToken();
  if (API_BASE_URL && token) {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(challenge)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
  }

  const existing = await fetchScheduledChallenges();
  const filtered = existing.filter(c => c.date !== challenge.date);
  const updated = [...filtered, challenge].sort((a, b) => a.date.localeCompare(b.date));
  localStorage.setItem('reelquest_admin_scheduled_challenges', JSON.stringify(updated));
  return challenge;
}

export async function deleteScheduledChallenge(date) {
  const existing = await fetchScheduledChallenges();
  const updated = existing.filter(c => c.date !== date);
  localStorage.setItem('reelquest_admin_scheduled_challenges', JSON.stringify(updated));
  return true;
}

export async function searchActors(query) {
  if (!query || query.trim().length === 0) return DEFAULT_ACTORS;
  const q = query.toLowerCase().trim();
  return DEFAULT_ACTORS.filter(a => a.name.toLowerCase().includes(q) || (a.knownFor && a.knownFor.toLowerCase().includes(q)));
}

// -----------------------------------------------------------------------------
// MODULE 3: USER MANAGEMENT & PRO CRM
// -----------------------------------------------------------------------------
export async function fetchUsersList(searchQuery = '', filterTier = 'ALL') {
  const stored = localStorage.getItem('reelquest_admin_users');
  let users = [];
  if (stored) {
    try { users = JSON.parse(stored); } catch {}
  }

  if (users.length === 0) {
    users = [
      {
        id: 'usr-101',
        email: 'wero@cinephile.ge',
        username: 'wero',
        tier: 'PRO',
        status: 'ACTIVE',
        streak: 7,
        longestStreak: 12,
        gamesPlayed: 24,
        gamesWon: 22,
        bestHops: 2,
        duelsWon: 9,
        joinedAt: '2026-10-12'
      },
      {
        id: 'usr-102',
        email: 'lnats17@gmail.com',
        username: 'lnats17',
        tier: 'FREE',
        status: 'ACTIVE',
        streak: 1,
        longestStreak: 1,
        gamesPlayed: 1,
        gamesWon: 1,
        bestHops: 3,
        duelsWon: 0,
        joinedAt: '2026-10-24'
      },
      {
        id: 'usr-103',
        email: 'alex.director@film.com',
        username: 'AlexCinema',
        tier: 'PRO',
        status: 'ACTIVE',
        streak: 14,
        longestStreak: 14,
        gamesPlayed: 35,
        gamesWon: 34,
        bestHops: 2,
        duelsWon: 15,
        joinedAt: '2026-09-30'
      },
      {
        id: 'usr-104',
        email: 'cheater_bot@fake.net',
        username: 'InstantBot_01',
        tier: 'FREE',
        status: 'BANNED',
        streak: 0,
        longestStreak: 5,
        gamesPlayed: 5,
        gamesWon: 5,
        bestHops: 1,
        duelsWon: 0,
        joinedAt: '2026-10-18'
      }
    ];
    localStorage.setItem('reelquest_admin_users', JSON.stringify(users));
  }

  return users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'ALL' || u.tier === filterTier;
    return matchesSearch && matchesTier;
  });
}

export async function updateUserTier(userId, newTier) {
  const users = await fetchUsersList();
  const updated = users.map(u => u.id === userId ? { ...u, tier: newTier } : u);
  localStorage.setItem('reelquest_admin_users', JSON.stringify(updated));
  return updated.find(u => u.id === userId);
}

export async function updateUserStatus(userId, newStatus) {
  const users = await fetchUsersList();
  const updated = users.map(u => u.id === userId ? { ...u, status: newStatus } : u);
  localStorage.setItem('reelquest_admin_users', JSON.stringify(updated));
  return updated.find(u => u.id === userId);
}

export async function resetUserStreak(userId, newStreak) {
  const users = await fetchUsersList();
  const updated = users.map(u => u.id === userId ? { ...u, streak: Number(newStreak) } : u);
  localStorage.setItem('reelquest_admin_users', JSON.stringify(updated));
  return updated.find(u => u.id === userId);
}

// -----------------------------------------------------------------------------
// MODULE 4: LEADERBOARD MODERATION & ANTI-CHEAT
// -----------------------------------------------------------------------------
export async function fetchFlaggedLeaderboard() {
  const stored = localStorage.getItem('reelquest_admin_flagged_scores');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }

  const initial = [
    {
      id: 'flag-1',
      date: new Date().toISOString().slice(0, 10),
      username: 'FastFinger99',
      userId: 'usr-bot-44',
      hops: 2,
      durationSeconds: 1.1,
      flagReason: 'SUSPICIOUS_SPEED (Completed in 1.1 seconds with 0 undos)',
      severity: 'HIGH',
      status: 'PENDING_REVIEW'
    },
    {
      id: 'flag-2',
      date: new Date().toISOString().slice(0, 10),
      username: 'DirectJumper',
      userId: 'usr-bot-88',
      hops: 1,
      durationSeconds: 0.8,
      flagReason: 'INVALID_HOP_COUNT (1 hop between unrelated stars)',
      severity: 'CRITICAL',
      status: 'PENDING_REVIEW'
    }
  ];

  localStorage.setItem('reelquest_admin_flagged_scores', JSON.stringify(initial));
  return initial;
}

export async function deleteFlaggedScore(id) {
  const flagged = await fetchFlaggedLeaderboard();
  const updated = flagged.filter(f => f.id !== id);
  localStorage.setItem('reelquest_admin_flagged_scores', JSON.stringify(updated));
  return true;
}

// -----------------------------------------------------------------------------
// MODULE 5: CINEMA GRAPH CONSOLE
// -----------------------------------------------------------------------------
export async function fetchCinemaGraphStats() {
  return {
    totalActors: 5420,
    totalMovies: 12180,
    totalCastEdges: 48920,
    graphDensity: 'High (Avg 9.2 connections/actor)',
    isolatedNodes: 0,
    lastSyncTimestamp: '2026-10-21 04:00 UTC (EventBridge Cron)',
    nextSyncTimestamp: '2026-10-28 04:00 UTC'
  };
}
