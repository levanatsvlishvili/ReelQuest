import { getAuthToken, RESOLVED_API_BASE_URL } from './auth';

export const API_BASE_URL = RESOLVED_API_BASE_URL;

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function getTmdbImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${path}`;
}

export async function fetchDailyChallenge(dateStr = null) {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured.');
  }

  const res = await fetch(`${API_BASE_URL}/daily${query}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch daily challenge (${res.status})`);
  }

  const data = await res.json();
  return {
    challengeId: `daily-${data.date}`,
    date: data.date,
    startActor: data.startActor,
    targetActor: data.targetActor,
    optimalHops: data.optimalDegrees || data.optimalHops || 2
  };
}

let cachedPopularActors = null;
export async function fetchPopularActors() {
  if (cachedPopularActors && cachedPopularActors.length > 0) {
    return cachedPopularActors;
  }
  try {
    const res = await fetch('/popular-actors.json');
    if (res.ok) {
      cachedPopularActors = await res.json();
      return cachedPopularActors;
    }
  } catch (err) {
    console.error('Failed to load popular actors:', err);
  }
  return [];
}

const actorMoviesCache = new Map();
const movieCastCache = new Map();

export async function fetchActorMovies(actorId) {
  if (!actorId) return [];
  if (actorMoviesCache.has(actorId)) {
    return actorMoviesCache.get(actorId);
  }
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }

  const res = await fetch(`${API_BASE_URL}/actors/${encodeURIComponent(actorId)}/movies`);
  if (!res.ok) {
    throw new Error(`Failed to load filmography for actor ${actorId}`);
  }
  const data = await res.json();
  actorMoviesCache.set(actorId, data);
  return data;
}

export async function fetchMovieCast(movieId, excludeActorId) {
  if (!movieId) return [];
  const cacheKey = `${movieId}-${excludeActorId}`;
  if (movieCastCache.has(cacheKey)) {
    return movieCastCache.get(cacheKey);
  }
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL not configured');
  }

  const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(movieId)}/cast`);
  if (!res.ok) {
    throw new Error(`Failed to load cast for movie ${movieId}`);
  }
  const data = await res.json();
  const filtered = Array.isArray(data) ? data.filter(a => a.id !== excludeActorId) : [];
  movieCastCache.set(cacheKey, filtered);
  return filtered;
}

export async function fetchOptimalPath(startActorId, targetActorId) {
  if (!API_BASE_URL) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/shortest-path?start=${encodeURIComponent(startActorId)}&target=${encodeURIComponent(targetActorId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.path && Array.isArray(data.path) && data.path.length > 0) {
        return data.path.map(step => ({
          actor: { id: step.fromActorId, name: step.fromActorName },
          movie: { id: step.movieId, title: step.movieTitle },
          nextActor: { id: step.toActorId, name: step.toActorName }
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to compute optimal shortest path:', err);
  }
  return [];
}

function compareLeaderboardItems(a, b, mode = 'six-degrees', scope = 'daily') {
  const aDur = (a.durationSeconds || 0) > 0 ? a.durationSeconds : 999999;
  const bDur = (b.durationSeconds || 0) > 0 ? b.durationSeconds : 999999;
  if (scope === 'all-time' || mode === 'global-xp') {
    return (b.score || 0) - (a.score || 0) || (b.moves || b.hops || 0) - (a.moves || a.hops || 0) || aDur - bDur;
  }
  if (mode === 'box-office') {
    return (b.score || 0) - (a.score || 0) || (b.hops || b.moves || 0) - (a.hops || a.moves || 0) || aDur - bDur;
  }
  const aHops = (a.hops || a.moves || 0) > 0 ? (a.hops || a.moves) : 99;
  const bHops = (b.hops || b.moves || 0) > 0 ? (b.hops || b.moves) : 99;
  return aHops - bHops || aDur - bDur || (b.score || 0) - (a.score || 0);
}

export async function submitGameScore(payload) {
  const token = getAuthToken();
  const cleanDate = String(payload.date || payload.challengeId || new Date().toISOString().slice(0, 10)).replace(/^daily-/, '');
  const mode = payload.gameMode || 'six-degrees';

  const storageKey = mode === 'six-degrees' ? `reelquest_lb_${cleanDate}` : `reelquest_lb_${mode}`;
  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const hopsVal = payload.hops ?? payload.moves ?? 2;
  const durVal = payload.durationSeconds || 0;
  const defaultSixDegreesScore = Math.max(100, 10000 - Math.max(0, hopsVal - 1) * 1200 - Math.min(durVal * 20, 4000));
  const entry = {
    userId: payload.userId || 'guest-user',
    username: payload.username || 'Cinephile',
    hops: hopsVal,
    moves: hopsVal,
    score: payload.score || defaultSixDegreesScore,
    durationSeconds: durVal,
    metricValue: payload.metricValue,
    gameMode: mode,
    date: cleanDate,
    submittedAt: new Date().toISOString(),
    isPro: payload.isPro || false
  };

  const filteredLocal = existing.filter(e => !(e.userId === entry.userId && (mode === 'six-degrees' || e.date === cleanDate)));
  filteredLocal.push(entry);
  filteredLocal.sort((a, b) => compareLeaderboardItems(a, b, mode, 'daily'));
  localStorage.setItem(storageKey, JSON.stringify(filteredLocal.slice(0, 100)));

  if (API_BASE_URL && (token || (payload.userId && !String(payload.userId).startsWith('guest')))) {
    try {
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`${API_BASE_URL}/games/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: payload.userId,
          username: payload.username,
          isPro: Boolean(payload.isPro),
          date: cleanDate,
          gameMode: mode,
          startActorId: payload.startActorId,
          targetActorId: payload.targetActorId,
          path: payload.path || [],
          durationSeconds: durVal,
          score: entry.score,
          moves: entry.moves,
          metricValue: payload.metricValue
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Remote game submit failed, saved to local leaderboard:', err);
    }
  }

  return { status: 'ACCEPTED', entry };
}

export async function fetchLeaderboard(challengeId, scope = 'daily', mode = 'six-degrees') {
  const cleanDate = scope === 'all-time'
    ? 'all-time'
    : (String(challengeId || '').replace(/^daily-/, '') || new Date().toISOString().slice(0, 10));

  let remoteEntries = [];
  if (API_BASE_URL) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/leaderboard?date=${encodeURIComponent(cleanDate)}&scope=${encodeURIComponent(scope)}&mode=${encodeURIComponent(mode)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          remoteEntries = data
            .filter(item => {
              const uid = item.userId || '';
              const uname = item.username || '';
              return !uid.startsWith('guest') && !uname.toLowerCase().includes('guest');
            })
            .map((item, idx) => ({
              rank: idx + 1,
              userId: item.userId,
              username: item.username && !item.username.startsWith('guest')
                ? item.username
                : 'Cinephile',
              score: item.score || 0,
              hops: item.moves || 0,
              moves: item.moves || 0,
              metricValue: item.metricValue || undefined,
              durationSeconds: item.durationSeconds || 0,
              isPro: item.isPro || false,
              date: cleanDate
            }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote leaderboard:', err);
    }
  }

  const storageKey = scope === 'all-time'
    ? `reelquest_lb_${mode}_all_time`
    : (mode === 'six-degrees' ? `reelquest_lb_${cleanDate}` : `reelquest_lb_${mode}`);
  const legacyKey = mode === 'six-degrees' && scope !== 'all-time'
    ? `reelquest_lb_daily-${cleanDate}`
    : (scope !== 'all-time' ? `reelquest_lb_${mode}_${cleanDate}` : null);

  const localRaw = [
    ...JSON.parse(localStorage.getItem(storageKey) || '[]'),
    ...(legacyKey ? JSON.parse(localStorage.getItem(legacyKey) || '[]') : [])
  ];

  const localFiltered = localRaw.filter(item => {
    const isGuest = !item.userId || item.userId.startsWith('guest') || (item.username || '').toLowerCase().includes('guest');
    if (isGuest) return false;
    if (item.gameMode && item.gameMode !== mode) return false;
    if (scope !== 'all-time' && item.date && String(item.date).replace(/^daily-/, '') !== cleanDate) return false;
    return true;
  });

  const mergedMap = new Map();
  for (const r of remoteEntries) {
    const key = (r.username || r.userId || '').toLowerCase();
    mergedMap.set(key, r);
  }
  for (const l of localFiltered) {
    const key = (l.username || l.userId || '').toLowerCase();
    const candidate = {
      userId: l.userId,
      username: l.username,
      score: l.score || 0,
      hops: l.hops ?? l.moves ?? 2,
      moves: l.moves ?? l.hops ?? 2,
      metricValue: l.metricValue,
      durationSeconds: l.durationSeconds || 0,
      isPro: Boolean(l.isPro),
      date: cleanDate
    };
    const prev = mergedMap.get(key);
    if (!prev || compareLeaderboardItems(candidate, prev, mode, scope) < 0) {
      mergedMap.set(key, candidate);
    }
  }

  const combined = Array.from(mergedMap.values());
  combined.sort((a, b) => compareLeaderboardItems(a, b, mode, scope));
  return combined.map((item, idx) => ({ ...item, rank: idx + 1 }));
}

export async function createDuel({
  hostUserId,
  hostNickname,
  startActorId,
  startActorName,
  startActorImage,
  targetActorId,
  targetActorName,
  targetActorImage
} = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured for Duels.');
  }

  const res = await fetch(`${API_BASE_URL}/duels/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      hostUserId,
      hostNickname,
      startActorId,
      startActorName,
      startActorImage,
      targetActorId,
      targetActorName,
      targetActorImage
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to create online duel (${res.status})`);
  }
  return await res.json();
}

export async function fetchDuel(duelId) {
  const safeId = (duelId || '').toLowerCase().trim();
  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured.');
  }

  const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(safeId)}`);
  if (!res.ok) {
    return null;
  }
  return await res.json();
}

export async function joinDuel(duelId, { guestUserId, guestUsername } = {}) {
  const safeId = (duelId || '').toLowerCase().trim();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured.');
  }

  const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(safeId)}/join`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ guestUserId, guestUsername })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to join duel.');
  }
  return await res.json();
}

export async function updateDuelProgress(duelId, { playerId, role, currentMoves, currentActorName, lastAction, emote }) {
  const safeId = (duelId || '').toLowerCase().trim();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!API_BASE_URL) return null;

  const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(safeId)}/progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ playerId, role, currentMoves, currentActorName, lastAction, emote })
  });

  if (!res.ok) return null;
  return await res.json();
}

export async function submitDuelScore(duelId, { playerId, playerName, role, moves, durationSeconds, timeSeconds, forfeited = false, pathSummary = null }) {
  const safeId = (duelId || '').toLowerCase().trim();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const finalDuration = Number(durationSeconds ?? timeSeconds ?? 0);

  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured.');
  }

  const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(safeId)}/submit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ playerId, playerName, role, moves, durationSeconds: finalDuration, forfeited, pathSummary })
  });

  if (!res.ok) {
    throw new Error('Failed to submit duel score.');
  }
  return await res.json();
}

export async function rematchDuel(duelId, customPayload = {}) {
  const safeId = (duelId || '').toLowerCase().trim();
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!API_BASE_URL) {
    throw new Error('API Gateway URL is not configured.');
  }

  const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(safeId)}/rematch`, {
    method: 'POST',
    headers,
    body: JSON.stringify(customPayload)
  });

  if (!res.ok) {
    throw new Error('Failed to create rematch.');
  }
  return await res.json();
}

export async function fetchOtaraHint(currentActorId, targetActorId) {
  if (!currentActorId || !targetActorId) return null;

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!API_BASE_URL) return null;

  try {
    const res = await fetch(
      `${API_BASE_URL}/games/hint?current=${encodeURIComponent(currentActorId)}&target=${encodeURIComponent(targetActorId)}`,
      { headers }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch Otara hint from backend:', err);
  }
  return null;
}

export async function fetchUserBackendHistory(userId) {
  if (!API_BASE_URL || !userId || userId.startsWith('guest')) {
    return [];
  }

  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(userId)}/history`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch user history from DynamoDB:', err);
  }
  return [];
}
