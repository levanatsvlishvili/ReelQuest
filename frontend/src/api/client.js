import { CURATED_GRAPH } from './mockData';
import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function getTmdbImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}${path}`;
}

export function findLocalShortestPath(startActorId, targetActorId) {
  if (startActorId === targetActorId) return [];

  const actorMovies = new Map();
  const movieActors = new Map();

  for (const edge of CURATED_GRAPH.edges) {
    if (!actorMovies.has(edge.actorId)) actorMovies.set(edge.actorId, []);
    actorMovies.get(edge.actorId).push(edge.movieId);

    if (!movieActors.has(edge.movieId)) movieActors.set(edge.movieId, []);
    movieActors.get(edge.movieId).push(edge.actorId);
  }

  const queue = [[startActorId]];
  const visitedActors = new Set([startActorId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const currentActor = path[path.length - 1];

    const movies = actorMovies.get(currentActor) || [];
    for (const movieId of movies) {
      const coStars = movieActors.get(movieId) || [];
      for (const nextActor of coStars) {
        if (nextActor === targetActorId) {
          const fullPath = [...path, nextActor];
          return buildPathDetails(fullPath);
        }
        if (!visitedActors.has(nextActor)) {
          visitedActors.add(nextActor);
          queue.push([...path, nextActor]);
        }
      }
    }
  }

  return [];
}

function buildPathDetails(actorIds) {
  const result = [];
  const actorsMap = new Map(CURATED_GRAPH.actors.map(a => [a.id, a]));
  const moviesMap = new Map(CURATED_GRAPH.movies.map(m => [m.id, m]));

  for (let i = 0; i < actorIds.length - 1; i++) {
    const a1 = actorIds[i];
    const a2 = actorIds[i + 1];

    const connectingEdge = CURATED_GRAPH.edges.find(e => 
      e.actorId === a1 && 
      CURATED_GRAPH.edges.some(e2 => e2.actorId === a2 && e2.movieId === e.movieId)
    );

    const movie = connectingEdge ? moviesMap.get(connectingEdge.movieId) : null;
    result.push({
      actor: actorsMap.get(a1),
      movie: movie,
      nextActor: actorsMap.get(a2)
    });
  }

  return result;
}

export async function fetchDailyChallenge(dateStr = null) {
  const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/daily${query}`);
      if (res.ok) {
        const data = await res.json();
        return {
          challengeId: `daily-${data.date}`,
          date: data.date,
          startActor: data.startActor,
          targetActor: data.targetActor,
          optimalHops: data.optimalDegrees || data.optimalHops || 2
        };
      }
    } catch {
      // Fallback to local data if API is unreachable
    }
  }

  const effectiveDate = dateStr || new Date().toISOString().slice(0, 10);
  const startActor = CURATED_GRAPH.actors.find(a => a.id === '31') || CURATED_GRAPH.actors.find(a => a.id === 'nm0000158') || {
    id: '31',
    name: 'Tom Hanks',
    profilePath: '/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg'
  };
  const targetActor = CURATED_GRAPH.actors.find(a => a.id === '6193') || CURATED_GRAPH.actors.find(a => a.id === 'nm0614165') || {
    id: '6193',
    name: 'Leonardo DiCaprio',
    profilePath: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg'
  };

  return {
    challengeId: `daily-${effectiveDate}`,
    date: effectiveDate,
    startActor,
    targetActor,
    optimalHops: 2
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
  return CURATED_GRAPH.actors || [];
}

const actorMoviesCache = new Map();
const movieCastCache = new Map();

export async function fetchActorMovies(actorId) {
  if (!actorId) return [];
  if (actorMoviesCache.has(actorId)) {
    return actorMoviesCache.get(actorId);
  }
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/actors/${actorId}/movies`);
      if (res.ok) {
        const data = await res.json();
        actorMoviesCache.set(actorId, data);
        return data;
      }
    } catch {
      // Fallback to local
    }
  }
  const local = getActorMovies(actorId);
  actorMoviesCache.set(actorId, local);
  return local;
}

export async function fetchMovieCast(movieId, excludeActorId) {
  if (!movieId) return [];
  const cacheKey = `${movieId}-${excludeActorId}`;
  if (movieCastCache.has(cacheKey)) {
    return movieCastCache.get(cacheKey);
  }
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${movieId}/cast`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter(a => a.id !== excludeActorId);
        movieCastCache.set(cacheKey, filtered);
        return filtered;
      }
    } catch {
      // Fallback to local
    }
  }
  const local = getMovieCast(movieId, excludeActorId);
  movieCastCache.set(cacheKey, local);
  return local;
}

export async function fetchOptimalPath(startActorId, targetActorId) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/shortest-path?start=${startActorId}&target=${targetActorId}`);
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
    } catch {
      // Fallback to local
    }
  }
  return findLocalShortestPath(startActorId, targetActorId);
}

export function getActorMovies(actorId) {
  const movieIds = CURATED_GRAPH.edges
    .filter(e => e.actorId === actorId)
    .map(e => e.movieId);

  const uniqueIds = [...new Set(movieIds)];
  return uniqueIds
    .map(id => CURATED_GRAPH.movies.find(m => m.id === id))
    .filter(Boolean);
}

export function getMovieCast(movieId, excludeActorId) {
  const castEdges = CURATED_GRAPH.edges.filter(
    e => e.movieId === movieId && e.actorId !== excludeActorId
  );

  return castEdges
    .map(e => {
      const actor = CURATED_GRAPH.actors.find(a => a.id === e.actorId);
      if (!actor) return null;
      return {
        ...actor,
        character: e.character
      };
    })
    .filter(Boolean);
}

export async function submitGameScore(payload) {
  const token = getAuthToken();
  if (API_BASE_URL && token) {
    try {
      const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const res = await fetch(`${API_BASE_URL}/games/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: payload.userId,
          startActorId: payload.startActorId,
          targetActorId: payload.targetActorId,
          path: payload.path || [],
          durationSeconds: payload.durationSeconds
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback to local storage persistence
    }
  }

  const storageKey = `reelquest_lb_${payload.challengeId}`;
  const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const entry = {
    userId: payload.userId || 'guest-user',
    username: payload.username || 'Cinephile',
    hops: payload.hops,
    durationSeconds: payload.durationSeconds,
    submittedAt: new Date().toISOString(),
    isPro: payload.isPro || false
  };

  existing.push(entry);
  existing.sort((a, b) => a.hops - b.hops || a.durationSeconds - b.durationSeconds);
  localStorage.setItem(storageKey, JSON.stringify(existing.slice(0, 50)));

  return { status: 'ACCEPTED', entry };
}

export async function fetchLeaderboard(challengeId, scope = 'daily') {
  if (API_BASE_URL) {
    try {
      const date = scope === 'all-time' ? 'all-time' : (challengeId?.replace('daily-', '') || new Date().toISOString().slice(0, 10));
      const res = await fetch(`${API_BASE_URL}/leaderboard?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data
            .filter(item => {
              const uid = item.userId || '';
              const uname = item.username || '';
              return !uid.startsWith('guest') && !uname.toLowerCase().includes('guest');
            })
            .map((item, idx) => ({
              rank: idx + 1,
              userId: item.userId,
              username: item.username && !item.username.startsWith('guest') && !item.username.includes('-')
                ? item.username
                : (item.username || 'Cinephile'),
              score: item.score || 0,
              hops: item.moves || 0,
              moves: item.moves || 0,
              durationSeconds: item.durationSeconds || 0,
              isPro: item.isPro || false
            }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote leaderboard:', err);
    }
  }

  const storageKey = scope === 'all-time' ? 'reelquest_lb_all_time' : `reelquest_lb_${challengeId}`;
  const local = JSON.parse(localStorage.getItem(storageKey) || '[]');
  return local
    .filter(item => item.userId && !item.userId.startsWith('guest') && item.username && !item.username.toLowerCase().includes('guest'))
    .map((item, idx) => ({ rank: idx + 1, ...item }));
}

export async function createDuel({ hostNickname, startActorId, targetActorId } = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/duels/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ hostNickname, startActorId, targetActorId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to call remote create duel, falling back to local:', err);
    }
  }

  // Fallback / mock duel for offline testing
  const duelId = Math.random().toString(36).substring(2, 9);
  const start = CURATED_GRAPH.actors.find(a => a.id === startActorId) || CURATED_GRAPH.actors[0];
  const target = CURATED_GRAPH.actors.find(a => a.id === targetActorId) || CURATED_GRAPH.actors[1];
  const duel = {
    duelId,
    hostUserId: 'host-local-' + Math.random().toString(36).substring(2, 6),
    hostUsername: hostNickname || 'Host Cinephile',
    guestUserId: null,
    guestUsername: null,
    startActor: start,
    targetActor: target,
    optimalHops: 2,
    hostMoves: null,
    hostDurationSeconds: null,
    guestMoves: null,
    guestDurationSeconds: null,
    status: 'WAITING',
    winnerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(`reelquest_duel_${duelId}`, JSON.stringify(duel));
  return duel;
}

export async function fetchDuel(duelId) {
  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(duelId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch remote duel, falling back to local:', err);
    }
  }

  const raw = localStorage.getItem(`reelquest_duel_${duelId}`);
  if (raw) return JSON.parse(raw);
  return null;
}

export async function joinDuel(duelId, { guestUserId, guestUsername } = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(duelId)}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ guestUserId, guestUsername })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to join remote duel, falling back to local:', err);
    }
  }

  const raw = localStorage.getItem(`reelquest_duel_${duelId}`);
  if (raw) {
    const duel = JSON.parse(raw);
    duel.guestUserId = guestUserId || 'guest-' + Math.random().toString(36).substring(2, 6);
    duel.guestUsername = guestUsername || 'Opponent Cinephile';
    duel.status = 'IN_PROGRESS';
    duel.updatedAt = new Date().toISOString();
    localStorage.setItem(`reelquest_duel_${duelId}`, JSON.stringify(duel));
    return duel;
  }
  return null;
}

export async function submitDuelScore(duelId, { playerId, playerName, moves, durationSeconds }) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (API_BASE_URL) {
    try {
      const res = await fetch(`${API_BASE_URL}/duels/${encodeURIComponent(duelId)}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ playerId, playerName, moves, durationSeconds })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to submit duel score remotely, falling back to local:', err);
    }
  }

  const raw = localStorage.getItem(`reelquest_duel_${duelId}`);
  if (raw) {
    const duel = JSON.parse(raw);
    const isHost = playerId === duel.hostUserId;
    if (isHost) {
      duel.hostMoves = moves;
      duel.hostDurationSeconds = durationSeconds;
    } else {
      duel.guestMoves = moves;
      duel.guestDurationSeconds = durationSeconds;
      if (!duel.guestUserId && playerId) {
        duel.guestUserId = playerId;
        duel.guestUsername = playerName || 'Guest';
      }
    }

    if (duel.hostMoves != null && duel.guestMoves != null) {
      duel.status = 'COMPLETED';
      if (duel.hostMoves < duel.guestMoves) {
        duel.winnerId = duel.hostUserId;
      } else if (duel.guestMoves < duel.hostMoves) {
        duel.winnerId = duel.guestUserId;
      } else {
        if (duel.hostDurationSeconds < duel.guestDurationSeconds) {
          duel.winnerId = duel.hostUserId;
        } else if (duel.guestDurationSeconds < duel.hostDurationSeconds) {
          duel.winnerId = duel.guestUserId;
        } else {
          duel.winnerId = 'TIE';
        }
      }
    } else {
      duel.status = 'IN_PROGRESS';
    }
    duel.updatedAt = new Date().toISOString();
    localStorage.setItem(`reelquest_duel_${duelId}`, JSON.stringify(duel));
    return duel;
  }
  return null;
}
