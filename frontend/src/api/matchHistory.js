import { fetchUserBackendHistory } from './client';

const MATCH_STORAGE_PREFIX = 'reelquest_match_history_';

/**
 * Saves a detailed match result to the user's match history.
 * Supports: Beat Otara (daily, archive, custom), 1v1 Duels, and future games.
 */
export function saveDetailedMatch(userId, matchData) {
  const effectiveUserId = userId || 'guest';
  const storageKey = `${MATCH_STORAGE_PREFIX}${effectiveUserId}`;

  const matchRecord = {
    id: matchData.id || `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    gameMode: matchData.gameMode || 'six-degrees', // 'six-degrees' | 'duels' | 'quoted' | 'plot-guesser'
    subMode: matchData.subMode || 'daily',        // 'daily' | 'archive' | 'custom' | 'duel'
    date: matchData.date || new Date().toISOString().slice(0, 10),
    timestamp: matchData.timestamp || new Date().toISOString(),
    won: Boolean(matchData.won),
    forfeited: Boolean(matchData.forfeited),
    hops: typeof matchData.hops === 'number' ? matchData.hops : 0,
    optimalHops: typeof matchData.optimalHops === 'number' ? matchData.optimalHops : null,
    matchedOtara: Boolean(matchData.matchedOtara || (matchData.won && matchData.optimalHops && matchData.hops <= matchData.optimalHops)),
    durationSeconds: typeof matchData.durationSeconds === 'number' ? matchData.durationSeconds : 0,
    startActor: matchData.startActor || null,
    targetActor: matchData.targetActor || null,
    chainLength: matchData.chain?.length || (matchData.hops ? matchData.hops + 1 : 0),
    undos: typeof matchData.undos === 'number' ? matchData.undos : 0,
    usedHint: Boolean(matchData.usedHint),
    // Spotle & Frame Sleuth & Box Office attributes
    targetMovie: matchData.targetMovie || null,
    guesses: matchData.guesses || null,
    framesUsed: matchData.framesUsed || null,
    boxOfficeScore: typeof matchData.boxOfficeScore === 'number' ? matchData.boxOfficeScore : null,
    // 1v1 Duel specific attributes
    opponentName: matchData.opponentName || null,
    roomCode: matchData.roomCode || null,
    duelOutcome: matchData.duelOutcome || (matchData.won ? 'VICTORY' : (matchData.forfeited ? 'FORFEITED' : 'DEFEAT'))
  };

  try {
    const raw = localStorage.getItem(storageKey);
    const existing = raw ? JSON.parse(raw) : [];
    // Deduplicate if identical id exists
    const filtered = existing.filter(m => m.id !== matchRecord.id);
    filtered.unshift(matchRecord);
    // Keep last 100 matches
    if (filtered.length > 100) filtered.length = 100;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.warn('Failed to save match history locally:', err);
    return [matchRecord];
  }
}

/**
 * Returns locally stored matches for a user or guest.
 */
export function getStoredMatchHistory(userId) {
  const effectiveUserId = userId || 'guest';
  const storageKey = `${MATCH_STORAGE_PREFIX}${effectiveUserId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Sanitize: remove any stale/incomplete placeholder matches
    const sanitized = list.filter(m => {
      const sName = m.startActor?.name;
      const tName = m.targetActor?.name;
      if (sName && sName.startsWith('Actor #')) return false;
      if (tName && tName.startsWith('Actor #')) return false;
      return true;
    });
    if (sanitized.length !== list.length) {
      localStorage.setItem(storageKey, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return [];
  }
}

export const getDetailedMatchHistory = getStoredMatchHistory;

/**
 * Fetches server history from DynamoDB and merges with local rich match history.
 * Only merges meaningful sessions that have valid actor details.
 */
export async function fetchAndMergeUserHistory(userId) {
  const localHistory = getStoredMatchHistory(userId);
  if (!userId || userId.startsWith('guest')) {
    return localHistory;
  }

  try {
    const serverSessions = await fetchUserBackendHistory(userId);
    if (!Array.isArray(serverSessions) || serverSessions.length === 0) {
      return localHistory;
    }

    const merged = [...localHistory];
    const existingDates = new Set(localHistory.map(m => m.date));

    for (const session of serverSessions) {
      // Only include server sessions if real actor names exist (avoid synthetic "Actor #1234" placeholders)
      const hasRealNames = session.startActorName && session.targetActorName;
      if (hasRealNames && session.date && !existingDates.has(session.date)) {
        merged.push({
          id: session.sessionId || `session_${session.date}`,
          gameMode: session.gameMode || 'six-degrees',
          subMode: 'daily',
          date: session.date,
          timestamp: session.createdAt || `${session.date}T12:00:00.000Z`,
          won: (session.score || 0) > 0 || (session.moves || 0) > 0,
          forfeited: false,
          hops: session.moves || 0,
          optimalHops: 2,
          matchedOtara: (session.moves || 0) <= 2,
          durationSeconds: session.durationSeconds || 0,
          startActor: { id: session.startActorId, name: session.startActorName },
          targetActor: { id: session.targetActorId, name: session.targetActorName },
          undos: 0,
          usedHint: false
        });
      }
    }

    // Sort descending by timestamp / date
    merged.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date).getTime() || 0;
      const timeB = new Date(b.timestamp || b.date).getTime() || 0;
      return timeB - timeA;
    });

    const storageKey = `${MATCH_STORAGE_PREFIX}${userId}`;
    localStorage.setItem(storageKey, JSON.stringify(merged.slice(0, 100)));
    return merged;
  } catch (err) {
    console.warn('Failed to merge server history:', err);
    return localHistory;
  }
}
