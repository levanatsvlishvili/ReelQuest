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
    return `${hops}/5 Correct`;
  }
  return `${hops} hops`;
}

function compareEntries(a, b, gameMode, scope) {
  const aDur = (a.durationSeconds || 0) > 0 ? a.durationSeconds : 999999;
  const bDur = (b.durationSeconds || 0) > 0 ? b.durationSeconds : 999999;
  if (scope === 'all-time' || gameMode === 'global-xp') {
    return (b.score || 0) - (a.score || 0) || (b.gamesWon || b.moves || 0) - (a.gamesWon || a.moves || 0) || aDur - bDur;
  }
  if (gameMode === 'box-office') {
    return (b.score || 0) - (a.score || 0) || (b.hops || b.moves || 0) - (a.hops || a.moves || 0) || aDur - bDur;
  }
  const aHops = (a.hops || a.moves || 0) > 0 ? (a.hops || a.moves) : 99;
  const bHops = (b.hops || b.moves || 0) > 0 ? (b.hops || b.moves) : 99;
  return aHops - bHops || aDur - bDur || (b.score || 0) - (a.score || 0);
}

export async function syncLocalScoresToBackend(currentUser) {
  if (!currentUser || !currentUser.id || String(currentUser.id).startsWith('guest')) {
    return;
  }
  try {
    const uid = currentUser.id;
    const uname = currentUser.username || 'Cinephile';
    const isPro = Boolean(currentUser.isPro);
    const candidates = new Map();

    const addCandidate = (mode, dateStr, hops, score, durationSeconds, path = []) => {
      const cleanDate = String(dateStr || '').replace(/^daily-/, '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return;
      const syncKey = `reelquest_synced_v3_${uid}_${mode}_${cleanDate}`;
      if (localStorage.getItem(syncKey) === '1') return;
      const mapKey = `${mode}:${cleanDate}`;
      const existing = candidates.get(mapKey);
      const next = {
        mode,
        date: cleanDate,
        hops: Math.max(1, Number(hops || 1)),
        score: Number(score || 100),
        durationSeconds: Math.max(1, Number(durationSeconds || 30)),
        path: Array.isArray(path) ? path : [],
        syncKey
      };
      if (!existing || compareEntries(next, existing, mode, 'daily') < 0) {
        candidates.set(mapKey, next);
      }
    };

    const history = getStoredMatchHistory(uid);
    for (const m of history) {
      if (!m || !m.won || !m.date || m.date === 'Custom') continue;
      const mode = m.gameMode || 'six-degrees';
      const hops = m.hops || m.framesUsed || m.boxOfficeScore || 2;
      const dur = m.durationSeconds || m.duration || 45;
      const score = mode === 'spotle'
        ? Math.max(100, 1000 - hops * 100)
        : mode === 'frame-sleuth'
          ? Math.max(50, 110 - hops * 15)
          : mode === 'box-office'
            ? (m.boxOfficeScore ?? hops) * 200
            : Math.max(100, 10000 - Math.max(0, hops - 1) * 1200 - Math.min(dur * 20, 4000));
      addCandidate(mode, m.date, hops, score, dur);
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('reelquest_session_daily-')) {
        const dateStr = k.replace('reelquest_session_daily-', '');
        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
        if (parsed && parsed.gameStatus === 'WON' && parsed.moves > 0) {
          const hops = parsed.moves;
          const dur = parsed.timerSeconds || 45;
          const score = Math.max(100, 10000 - Math.max(0, hops - 1) * 1200 - Math.min(dur * 20, 4000));
          addCandidate('six-degrees', dateStr, hops, score, dur);
        }
      } else if (k.startsWith('reelquest_spotle_')) {
        const dateStr = k.replace('reelquest_spotle_', '');
        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
        if (parsed && parsed.status === 'WON' && Array.isArray(parsed.guesses) && parsed.guesses.length > 0) {
          const hops = parsed.guesses.length;
          const dur = parsed.timerSeconds || 45;
          addCandidate('spotle', dateStr, hops, Math.max(100, 1000 - hops * 100), dur);
        }
      } else if (k.startsWith('reelquest_framesleuth_')) {
        const dateStr = k.replace('reelquest_framesleuth_', '');
        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
        if (parsed && parsed.status === 'WON' && Array.isArray(parsed.guesses) && parsed.guesses.length > 0) {
          const hops = parsed.guesses.length;
          const dur = parsed.timerSeconds || 30;
          addCandidate('frame-sleuth', dateStr, hops, Math.max(50, 110 - hops * 15), dur);
        }
      } else if (k.startsWith('reelquest_bo_daily_')) {
        const dateStr = k.replace('reelquest_bo_daily_', '');
        const parsed = JSON.parse(localStorage.getItem(k) || 'null');
        if (parsed && parsed.complete && (parsed.score ?? 0) >= 3) {
          const hops = parsed.score;
          const dur = parsed.timerSeconds || 45;
          addCandidate('box-office', dateStr, hops, hops * 200, dur);
        }
      }
    }

    for (const c of candidates.values()) {
      localStorage.setItem(c.syncKey, '1');
      await submitGameScore({
        gameMode: c.mode,
        challengeId: c.date,
        date: c.date,
        userId: uid,
        username: uname,
        hops: c.hops,
        moves: c.hops,
        score: c.score,
        durationSeconds: c.durationSeconds,
        isPro
      });
    }
  } catch (err) {
    console.warn('Background leaderboard sync warning:', err);
  }
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
    const normalizedEntry = { ...entry, gameMode: mode, date: cleanDate };
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

  if (currentUser && !currentUser.id?.startsWith('guest')) {
    await syncLocalScoresToBackend(currentUser);
  }

  if (gameMode === 'global-xp') {
    const remoteAllTime = await fetchBaseLeaderboard('all-time', 'all-time', 'global-xp');
    const entriesMap = new Map();

    for (const r of remoteAllTime) {
      const xp = r.score || 0;
      const rankInfo = calculateCinemaLevel({ totalScore: xp * 2, isPro: Boolean(r.isPro) }, []);
      const dedupKey = (r.username || r.userId || '').toLowerCase();
      const prev = entriesMap.get(dedupKey);
      if (!prev || xp > prev.score) {
        entriesMap.set(dedupKey, {
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
    }

    if (currentUser && !currentUser.id?.startsWith('guest')) {
      const stats = getUserStats(currentUser.id);
      const history = getStoredMatchHistory(currentUser.id);
      const levelInfo = calculateCinemaLevel({ ...stats, isPro: currentUser.isPro }, history);
      const userXP = levelInfo.totalXp || 0;
      if (userXP > 0) {
        const dedupKey = (currentUser.username || currentUser.id).toLowerCase();
        const existing = entriesMap.get(dedupKey);
        const bestScore = Math.max(userXP, existing?.score || 0);
        entriesMap.set(dedupKey, {
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

    const sorted = Array.from(entriesMap.values()).sort((a, b) => compareEntries(a, b, 'global-xp', 'all-time'));
    return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  const remoteEntries = await fetchBaseLeaderboard(cleanDate, scope, gameMode);
  const localKey = `reelquest_lb_${gameMode}`;
  const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
  const validStored = stored.filter(s => {
    const isGuest = !s.userId || s.userId.startsWith('guest') || (s.username || '').toLowerCase().includes('guest');
    if (isGuest) return false;
    if (s.gameMode && s.gameMode !== gameMode) return false;
    return scope === 'all-time' ? true : String(s.date || '').replace(/^daily-/, '') === cleanDate;
  });

  const mergedMap = new Map();
  for (const r of remoteEntries) {
    const hops = r.hops ?? r.moves ?? 2;
    const dedupKey = (r.username || r.userId || '').toLowerCase();
    const candidate = {
      ...r,
      hops,
      moves: hops,
      gamesWon: scope === 'all-time' ? Math.max(1, r.moves || 1) : 1,
      metricLabel: getMetricLabel(gameMode),
      metricValue: formatMetricValue({ ...r, hops }, gameMode, scope)
    };
    const prev = mergedMap.get(dedupKey);
    if (!prev || compareEntries(candidate, prev, gameMode, scope) < 0) {
      mergedMap.set(dedupKey, candidate);
    }
  }

  if (scope === 'all-time') {
    const localAggByUser = new Map();
    for (const s of validStored) {
      const dedupKey = (s.username || s.userId || '').toLowerCase();
      const dStr = String(s.date || '').replace(/^daily-/, '');
      if (!localAggByUser.has(dedupKey)) {
        localAggByUser.set(dedupKey, {
          userId: s.userId,
          username: s.username,
          isPro: Boolean(s.isPro),
          dates: new Map()
        });
      }
      const uEntry = localAggByUser.get(dedupKey);
      const prevDateEntry = uEntry.dates.get(dStr);
      if (!prevDateEntry || (s.score || 0) > (prevDateEntry.score || 0)) {
        uEntry.dates.set(dStr, s);
      }
    }
    for (const [dedupKey, uEntry] of localAggByUser.entries()) {
      let totalScore = 0;
      let minDur = 0;
      for (const dEntry of uEntry.dates.values()) {
        totalScore += (dEntry.score || 0);
        const dur = dEntry.durationSeconds || 0;
        if (dur > 0 && (minDur === 0 || dur < minDur)) minDur = dur;
      }
      const gamesWon = Math.max(1, uEntry.dates.size);
      const prev = mergedMap.get(dedupKey);
      if (!prev || totalScore > (prev.score || 0)) {
        mergedMap.set(dedupKey, {
          ...(prev || {}),
          userId: uEntry.userId || prev?.userId,
          username: uEntry.username || prev?.username,
          isPro: Boolean(uEntry.isPro || prev?.isPro),
          hops: Math.max(gamesWon, prev?.hops || 1),
          moves: Math.max(gamesWon, prev?.moves || 1),
          gamesWon: Math.max(gamesWon, prev?.gamesWon || 1),
          score: Math.max(totalScore, prev?.score || 0),
          durationSeconds: minDur || prev?.durationSeconds || 0,
          metricLabel: getMetricLabel(gameMode),
          metricValue: formatMetricValue({ hops: Math.max(gamesWon, prev?.hops || 1), score: Math.max(totalScore, prev?.score || 0) }, gameMode, scope)
        });
      }
    }
  } else {
    for (const s of validStored) {
      const dedupKey = (s.username || s.userId || '').toLowerCase();
      const hops = s.hops ?? s.moves ?? 2;
      const candidate = {
        ...s,
        hops,
        moves: hops,
        gamesWon: 1,
        metricLabel: getMetricLabel(gameMode),
        metricValue: formatMetricValue({ ...s, hops }, gameMode, scope)
      };
      const prev = mergedMap.get(dedupKey);
      if (!prev) {
        mergedMap.set(dedupKey, candidate);
      } else if (compareEntries(candidate, prev, gameMode, scope) < 0) {
        mergedMap.set(dedupKey, {
          ...prev,
          ...candidate,
          gamesWon: Math.max(prev.gamesWon || 1, candidate.gamesWon || 1)
        });
      }
    }
  }

  if (currentUser && !currentUser.id?.startsWith('guest')) {
    const dedupKey = (currentUser.username || currentUser.id).toLowerCase();
    const userHistory = getStoredMatchHistory(currentUser.id).filter(m => {
      if (!m.won) return false;
      const modeMatches = m.gameMode === gameMode || (gameMode === 'six-degrees' && !m.gameMode);
      if (!modeMatches) return false;
      return scope === 'all-time' ? true : String(m.date || '').replace(/^daily-/, '') === cleanDate;
    });
    if (userHistory.length > 0 && !mergedMap.has(dedupKey)) {
      const calcMatchScore = (m) => {
        const h = m.hops || m.framesUsed || m.boxOfficeScore || 2;
        const d = m.durationSeconds || m.duration || 45;
        return gameMode === 'spotle'
          ? Math.max(100, 1000 - h * 100)
          : gameMode === 'frame-sleuth'
            ? Math.max(50, 110 - h * 15)
            : gameMode === 'box-office'
              ? (m.boxOfficeScore ?? h) * 200
              : Math.max(100, 10000 - Math.max(0, h - 1) * 1200 - Math.min(d * 20, 4000));
      };
      const best = userHistory[0];
      const hops = best.hops || best.framesUsed || best.boxOfficeScore || 2;
      const dur = best.durationSeconds || best.duration || 45;
      const score = scope === 'all-time'
        ? userHistory.reduce((acc, m) => acc + calcMatchScore(m), 0)
        : calcMatchScore(best);
      mergedMap.set(dedupKey, {
        userId: currentUser.id,
        username: currentUser.username,
        isPro: Boolean(currentUser.isPro),
        hops: scope === 'all-time' ? userHistory.length : hops,
        moves: scope === 'all-time' ? userHistory.length : hops,
        score,
        durationSeconds: dur,
        gamesWon: userHistory.length,
        metricLabel: getMetricLabel(gameMode),
        metricValue: formatMetricValue({ hops, score }, gameMode, scope)
      });
    }
  }

  const finalEntries = Array.from(mergedMap.values());
  finalEntries.sort((a, b) => compareEntries(a, b, gameMode, scope));

  return finalEntries.map((item, idx) => ({ ...item, rank: idx + 1 }));
}
