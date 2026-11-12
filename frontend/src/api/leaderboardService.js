import { fetchLeaderboard as fetchBaseLeaderboard, submitGameScore } from './client';
import { getUserStats } from './auth';
import { getStoredMatchHistory } from './matchHistory';
import { calculateCinemaLevel } from '../utils/cinemaLevels';

function getMetricLabel(gameMode) {
  switch (gameMode) {
    case 'spotle':
      return 'Guesses';
    case 'frame-sleuth':
      return 'Frame';
    case 'box-office':
      return 'Score / Streak';
    case 'global-xp':
      return 'Cinema XP';
    case 'six-degrees':
    default:
      return 'Hops';
  }
}

function formatMetricValue(item, gameMode, scope) {
  if (item.metricValue) return item.metricValue;
  if (gameMode === 'global-xp') {
    return `${item.score || 0} XP`;
  }
  if (scope === 'all-time') {
    return `${item.score || 0} pts`;
  }
  const hops = item.hops ?? item.moves ?? 2;
  if (gameMode === 'spotle') {
    return `${hops} guesses`;
  }
  if (gameMode === 'frame-sleuth') {
    return `Frame ${hops}`;
  }
  if (gameMode === 'box-office') {
    return `${item.score || hops} pts`;
  }
  return `${hops} hops`;
}

export function recordScoreToLeaderboard(mode, entry) {
  try {
    const isGuest = !entry.userId || entry.userId.startsWith('guest') || (entry.username || '').toLowerCase().includes('guest');
    if (isGuest) {
      return;
    }

    const cleanDate = String(entry.date || new Date().toISOString().slice(0, 10)).replace(/^daily-/, '');
    const key = `reelquest_lb_${mode}`;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = stored.filter(e => !(e.userId === entry.userId && e.date === cleanDate));
    const normalizedEntry = { ...entry, date: cleanDate };
    filtered.push(normalizedEntry);
    localStorage.setItem(key, JSON.stringify(filtered.slice(-100)));

    submitGameScore({
      gameMode: mode,
      challengeId: cleanDate,
      date: cleanDate,
      userId: entry.userId,
      username: entry.username,
      hops: entry.hops ?? entry.moves ?? 1,
      moves: entry.moves ?? entry.hops ?? 1,
      score: entry.score || 1000,
      durationSeconds: entry.durationSeconds || 0,
      metricValue: entry.metricValue,
      isPro: Boolean(entry.isPro)
    });
  } catch (e) {
    console.error('Failed to record leaderboard score:', e);
  }
}

export function recordLeaderboardScore(gameMode, entry) {
  return recordScoreToLeaderboard(gameMode, entry);
}

export async function fetchMultiGameLeaderboard(gameMode = 'six-degrees', scope = 'daily', challengeId = '', currentUser = null) {
  const cleanDate = String(challengeId || new Date().toISOString().slice(0, 10)).replace(/^daily-/, '');

  if (gameMode === 'global-xp') {
    const remoteAllTime = await fetchBaseLeaderboard('all-time', 'all-time', 'global-xp');
    const entriesMap = new Map();

    for (const r of remoteAllTime) {
      const xp = r.score || 0;
      const rankInfo = calculateCinemaLevel({ totalScore: xp * 2, isPro: Boolean(r.isPro) }, []);
      entriesMap.set(r.userId || r.username, {
        userId: r.userId,
        username: r.username,
        isPro: Boolean(r.isPro),
        score: xp,
        level: rankInfo.level,
        levelTitle: rankInfo.title,
        hops: r.moves || 1,
        gamesWon: Math.max(1, r.moves || 1),
        durationSeconds: r.durationSeconds || 0,
        streak: 1,
        metricLabel: 'Cinema XP',
        metricValue: `${xp} XP • Lv.${rankInfo.level}`
      });
    }

    if (currentUser && !currentUser.id?.startsWith('guest')) {
      const stats = getUserStats(currentUser.id);
      const history = getStoredMatchHistory(currentUser.id);
      const levelInfo = calculateCinemaLevel({ ...stats, isPro: currentUser.isPro }, history);
      const userXP = levelInfo.totalXp || 0;
      if (userXP > 0) {
        const existing = entriesMap.get(currentUser.id) || entriesMap.get(currentUser.username);
        const bestScore = Math.max(userXP, existing?.score || 0);
        entriesMap.set(currentUser.id, {
          userId: currentUser.id,
          username: currentUser.username || 'You',
          isPro: Boolean(currentUser.isPro || existing?.isPro),
          score: bestScore,
          level: levelInfo.level,
          levelTitle: levelInfo.title,
          hops: Math.max(stats?.gamesWon || 0, existing?.hops || 0),
          gamesWon: Math.max(stats?.gamesWon || 0, existing?.gamesWon || 0),
          durationSeconds: existing?.durationSeconds || 0,
          streak: stats?.streak || 0,
          metricLabel: 'Cinema XP',
          metricValue: `${bestScore} XP • Lv.${levelInfo.level}`
        });
      }
    }

    const sorted = Array.from(entriesMap.values()).sort((a, b) => b.score - a.score);
    return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  const remoteEntries = await fetchBaseLeaderboard(cleanDate, scope, gameMode);
  const localKey = `reelquest_lb_${gameMode}`;
  const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
  const validStored = stored.filter(s => {
    const isGuest = !s.userId || s.userId.startsWith('guest') || (s.username || '').toLowerCase().includes('guest');
    if (isGuest) return false;
    return scope === 'all-time' ? true : String(s.date || '').replace(/^daily-/, '') === cleanDate;
  });

  const mergedMap = new Map();
  for (const r of remoteEntries) {
    const hops = r.hops ?? r.moves ?? 2;
    mergedMap.set(r.userId || r.username, {
      ...r,
      hops,
      moves: hops,
      gamesWon: scope === 'all-time' ? Math.max(1, r.moves || 1) : 1,
      metricLabel: getMetricLabel(gameMode),
      metricValue: formatMetricValue({ ...r, hops }, gameMode, scope)
    });
  }

  for (const s of validStored) {
    const key = s.userId || s.username;
    const hops = s.hops ?? s.moves ?? 2;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, {
        ...s,
        hops,
        moves: hops,
        gamesWon: 1,
        metricLabel: getMetricLabel(gameMode),
        metricValue: formatMetricValue({ ...s, hops }, gameMode, scope)
      });
    } else if (scope === 'all-time') {
      const prev = mergedMap.get(key);
      if ((s.score || 0) > (prev.score || 0)) {
        prev.score = s.score;
        prev.metricValue = formatMetricValue(prev, gameMode, scope);
      }
    }
  }

  if (currentUser && !currentUser.id?.startsWith('guest')) {
    const userHistory = getStoredMatchHistory(currentUser.id).filter(m => {
      if (!m.won) return false;
      if (m.gameMode !== gameMode) return false;
      return scope === 'all-time' ? true : String(m.date || '').replace(/^daily-/, '') === cleanDate;
    });
    if (userHistory.length > 0 && !mergedMap.has(currentUser.id) && !mergedMap.has(currentUser.username)) {
      const best = userHistory[0];
      const hops = best.hops || best.framesUsed || 2;
      const score = gameMode === 'spotle'
        ? Math.max(100, 1000 - hops * 100)
        : gameMode === 'frame-sleuth'
          ? Math.max(50, 110 - hops * 15)
          : gameMode === 'box-office'
            ? (best.boxOfficeScore ?? hops) * 150
            : Math.max(100, 1000 - hops * 120);
      mergedMap.set(currentUser.id, {
        userId: currentUser.id,
        username: currentUser.username,
        isPro: Boolean(currentUser.isPro),
        hops,
        moves: hops,
        score,
        durationSeconds: best.durationSeconds || 45,
        gamesWon: userHistory.length,
        metricLabel: getMetricLabel(gameMode),
        metricValue: formatMetricValue({ hops, score }, gameMode, scope)
      });
    }
  }

  const finalEntries = Array.from(mergedMap.values());
  finalEntries.sort((a, b) => {
    if (scope === 'all-time') return (b.score || 0) - (a.score || 0);
    if (gameMode === 'box-office') {
      return (b.score || 0) - (a.score || 0) || (a.durationSeconds || 0) - (b.durationSeconds || 0);
    }
    return (a.hops || 99) - (b.hops || 99) || (a.durationSeconds || 0) - (b.durationSeconds || 0);
  });

  return finalEntries.map((item, idx) => ({ ...item, rank: idx + 1 }));
}
