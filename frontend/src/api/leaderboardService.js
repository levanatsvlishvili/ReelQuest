import { fetchLeaderboard as fetchBaseLeaderboard } from './client';
import { getStoredMatchHistory } from './matchHistory';

function getMetricLabel(gameMode) {
  switch (gameMode) {
    case 'spotle': return 'Guesses';
    case 'frame-sleuth': return 'Frame';
    case 'box-office': return 'Score / Streak';
    case 'global-xp': return 'Cinema XP';
    case 'six-degrees':
    default: return 'Hops';
  }
}

function sortLeaderboard(list, gameMode) {
  if (gameMode === 'spotle' || gameMode === 'frame-sleuth' || gameMode === 'six-degrees') {
    // Fewer hops / guesses / frames is better; tie-breaker: shorter duration
    list.sort((a, b) => {
      const hopsA = a.hops ?? 99;
      const hopsB = b.hops ?? 99;
      if (hopsA !== hopsB) return hopsA - hopsB;
      return (a.durationSeconds || 0) - (b.durationSeconds || 0);
    });
  } else {
    // Higher score / streak / XP is better
    list.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}

function normalizeLeaderboard(list, gameMode, scope) {
  return list.map((item, idx) => {
    let metricValue = `${item.hops || item.moves || 2} hops`;
    if (scope === 'all-time') {
      metricValue = `${item.score || 0} pts`;
    }
    return {
      rank: idx + 1,
      userId: item.userId,
      username: item.username || 'Cinephile',
      isPro: item.isPro || false,
      score: item.score || 0,
      hops: item.hops || item.moves || 0,
      durationSeconds: item.durationSeconds || 0,
      metricLabel: getMetricLabel(gameMode),
      metricValue
    };
  });
}

/**
 * Multi-game leaderboard retrieval function — 100% Real Data Only.
 * Fetches from remote API (AWS DynamoDB) or reads real player submissions from local storage.
 * Never generates or returns mock or artificial players.
 */
export async function fetchMultiGameLeaderboard(gameMode = 'six-degrees', scope = 'daily', dateStr = null, currentUser = null) {
  const effectiveDate = dateStr || new Date().toISOString().slice(0, 10);
  let records = [];

  // 1. If Beat Otara ('six-degrees'), attempt to fetch from backend API
  if (gameMode === 'six-degrees') {
    try {
      const challengeId = `daily-${effectiveDate}`;
      const remoteData = await fetchBaseLeaderboard(challengeId, scope);
      if (Array.isArray(remoteData) && remoteData.length > 0) {
        records = normalizeLeaderboard(remoteData, gameMode, scope);
      }
    } catch {
      // Remote API unavailable, fallback to real locally recorded submissions
    }
  }

  // 2. If no remote records or for other game modes, read real stored submissions
  if (records.length === 0) {
    const localKey = scope === 'all-time'
      ? `reelquest_lb_${gameMode}_all_time`
      : `reelquest_lb_${gameMode}_${effectiveDate}`;

    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          records = parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse local leaderboard:', e);
    }
  }

  // 3. Extract matching real completed matches from the current user's profile
  const userMatches = currentUser?.id ? getStoredMatchHistory(currentUser.id) : [];
  const relevantUserMatches = userMatches.filter(m => {
    if (!m.won) return false;
    if (m.gameMode !== gameMode) return false;
    if (scope === 'daily') {
      return m.date === effectiveDate;
    }
    return true;
  });

  // Inject current user's real performance if completed
  if (relevantUserMatches.length > 0 && currentUser) {
    const bestMatch = relevantUserMatches[0];
    let userMetricValue = '';
    let userHops = bestMatch.hops || 2;
    let userScore = 500;

    if (gameMode === 'spotle') {
      const g = bestMatch.hops || bestMatch.guesses?.length || 4;
      userMetricValue = `${g} guesses`;
      userHops = g;
      userScore = Math.max(100, 1000 - g * 100);
    } else if (gameMode === 'frame-sleuth') {
      const f = bestMatch.framesUsed || bestMatch.hops || 1;
      userMetricValue = `Frame ${f} (${Math.max(50, 110 - f * 15)} pts)`;
      userHops = f;
      userScore = Math.max(50, 110 - f * 15);
    } else if (gameMode === 'box-office') {
      const s = bestMatch.boxOfficeScore ?? bestMatch.hops ?? 5;
      userMetricValue = `${s} Score`;
      userHops = s;
      userScore = s * 150;
    } else {
      userMetricValue = `${userHops} hops`;
      userScore = Math.max(100, 1000 - userHops * 120);
    }

    const userEntry = {
      userId: currentUser.id,
      username: currentUser.username,
      isPro: currentUser.isPro || false,
      countryFlag: currentUser.countryFlag || '🌍',
      hops: userHops,
      durationSeconds: bestMatch.durationSeconds || 60,
      score: userScore,
      metricValue: userMetricValue,
      metricLabel: getMetricLabel(gameMode),
      gamesWon: relevantUserMatches.length
    };

    records = records.filter(r => r.userId !== currentUser.id && r.username !== currentUser.username);
    records.unshift(userEntry);
  }

  // 4. Sort strictly according to real game metrics
  sortLeaderboard(records, gameMode);

  // 5. Assign ranks
  return records.slice(0, 50).map((item, idx) => ({
    rank: idx + 1,
    ...item
  }));
}

/**
 * Saves a real player's score to the real leaderboard storage.
 */
export function recordLeaderboardScore(gameMode, { userId, username, isPro, hops, score, durationSeconds, date }) {
  if (!userId || userId.startsWith('guest')) return;
  const effectiveDate = date || new Date().toISOString().slice(0, 10);
  const dailyKey = `reelquest_lb_${gameMode}_${effectiveDate}`;
  const allTimeKey = `reelquest_lb_${gameMode}_all_time`;

  const newEntry = {
    userId,
    username,
    isPro: Boolean(isPro),
    hops,
    score: score || 100,
    durationSeconds: durationSeconds || 45,
    submittedAt: new Date().toISOString()
  };

  try {
    // Save daily
    const dailyRaw = localStorage.getItem(dailyKey);
    const dailyList = dailyRaw ? JSON.parse(dailyRaw) : [];
    const filteredDaily = dailyList.filter(e => e.userId !== userId);
    filteredDaily.push(newEntry);
    sortLeaderboard(filteredDaily, gameMode);
    localStorage.setItem(dailyKey, JSON.stringify(filteredDaily.slice(0, 50)));

    // Save all-time
    const allTimeRaw = localStorage.getItem(allTimeKey);
    const allTimeList = allTimeRaw ? JSON.parse(allTimeRaw) : [];
    const filteredAllTime = allTimeList.filter(e => e.userId !== userId);
    filteredAllTime.push(newEntry);
    sortLeaderboard(filteredAllTime, gameMode);
    localStorage.setItem(allTimeKey, JSON.stringify(filteredAllTime.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to record leaderboard score:', e);
  }
}
