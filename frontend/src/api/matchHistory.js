import { fetchUserBackendHistory } from './client';
import { notifyDailyProgressChanged } from '../utils/dailyProgress';

const MATCH_STORAGE_PREFIX = 'reelquest_match_history_';

export function saveDetailedMatch(userId, matchData) {
  const effectiveUserId = userId || 'guest';
  const storageKey = `${MATCH_STORAGE_PREFIX}${effectiveUserId}`;

  const matchRecord = {
    id: matchData.id || `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    gameMode: matchData.gameMode || 'six-degrees',
    subMode: matchData.subMode || 'daily',
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
    targetMovie: matchData.targetMovie || null,
    guesses: matchData.guesses || null,
    framesUsed: matchData.framesUsed || null,
    boxOfficeScore: typeof matchData.boxOfficeScore === 'number' ? matchData.boxOfficeScore : null,
    opponentName: matchData.opponentName || null,
    roomCode: matchData.roomCode || null,
    duelOutcome: matchData.duelOutcome || (matchData.won ? 'VICTORY' : (matchData.forfeited ? 'FORFEITED' : 'DEFEAT'))
  };

  try {
    const raw = localStorage.getItem(storageKey);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(m => m.id !== matchRecord.id);
    filtered.unshift(matchRecord);
    if (filtered.length > 100) filtered.length = 100;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    notifyDailyProgressChanged();
    return filtered;
  } catch (err) {
    console.warn('Failed to save match history locally:', err);
    return [matchRecord];
  }
}

export function getStoredMatchHistory(userId) {
  const effectiveUserId = userId || 'guest';
  const storageKey = `${MATCH_STORAGE_PREFIX}${effectiveUserId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
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

function buildMatchRecordFromSession(session) {
  const gameMode = (session.gameMode || 'six-degrees').toLowerCase();
  const dateStr = session.date || (session.createdAt ? String(session.createdAt).slice(0, 10) : '');
  const moves = Number(session.moves || 0);
  const score = Number(session.score || 0);
  const won = score > 0 || moves > 0;
  const optimalHops = typeof session.optimalHops === 'number'
    ? session.optimalHops
    : (gameMode === 'six-degrees' ? 2 : 1);
  const matchedOtara = typeof session.matchedOtara === 'boolean'
    ? session.matchedOtara
    : (gameMode === 'six-degrees' && won && moves > 0 && moves <= optimalHops);

  const hasStartName = Boolean(session.startActorName && !String(session.startActorName).startsWith('Actor #'));
  const hasTargetName = Boolean(session.targetActorName && !String(session.targetActorName).startsWith('Actor #'));

  const targetMovie = session.targetMovieTitle
    ? {
        title: session.targetMovieTitle,
        year: session.targetMovieYear || null,
        director: session.targetMovieDirector || null,
        posterPath: session.targetMoviePosterPath || null
      }
    : null;

  return {
    id: session.sessionId || `session_${dateStr}_${gameMode}`,
    gameMode,
    subMode: session.subMode || 'daily',
    date: dateStr,
    timestamp: session.createdAt || (dateStr ? `${dateStr}T12:00:00.000Z` : new Date().toISOString()),
    won,
    forfeited: false,
    hops: moves,
    optimalHops,
    matchedOtara,
    durationSeconds: Number(session.durationSeconds || 0),
    score,
    startActor: hasStartName ? { id: session.startActorId, name: session.startActorName } : null,
    targetActor: hasTargetName ? { id: session.targetActorId, name: session.targetActorName } : null,
    targetMovie,
    framesUsed: gameMode === 'frame-sleuth' ? Math.max(1, moves) : null,
    boxOfficeScore: gameMode === 'box-office' ? moves : null,
    undos: typeof session.undos === 'number' ? session.undos : 0,
    usedHint: Boolean(session.usedHint)
  };
}

export async function fetchAndMergeUserHistory(userId, persistLocal = true) {
  const localHistory = persistLocal ? getStoredMatchHistory(userId) : [];
  if (!userId || String(userId).startsWith('guest')) {
    return localHistory;
  }

  try {
    const serverSessions = await fetchUserBackendHistory(userId);
    if (!Array.isArray(serverSessions) || serverSessions.length === 0) {
      return localHistory;
    }

    const mergedMap = new Map();

    for (const localMatch of localHistory) {
      if (!localMatch) continue;
      const mode = (localMatch.gameMode || 'six-degrees').toLowerCase();
      const key = (localMatch.date && localMatch.subMode !== 'custom' && mode !== 'duels')
        ? `${mode}#${localMatch.date}`
        : (localMatch.id || `${mode}#${localMatch.timestamp || mergedMap.size}`);
      mergedMap.set(key, localMatch);
    }

    for (const session of serverSessions) {
      if (!session) continue;
      const serverRecord = buildMatchRecordFromSession(session);
      if (!serverRecord.date) continue;
      const key = serverRecord.subMode !== 'custom' && serverRecord.gameMode !== 'duels'
        ? `${serverRecord.gameMode}#${serverRecord.date}`
        : serverRecord.id;

      const existing = mergedMap.get(key);
      if (!existing) {
        mergedMap.set(key, serverRecord);
      } else {
        mergedMap.set(key, {
          ...serverRecord,
          ...existing,
          startActor: existing.startActor?.name ? existing.startActor : serverRecord.startActor,
          targetActor: existing.targetActor?.name ? existing.targetActor : serverRecord.targetActor,
          targetMovie: existing.targetMovie?.title ? existing.targetMovie : serverRecord.targetMovie,
          durationSeconds: existing.durationSeconds || serverRecord.durationSeconds,
          score: Math.max(existing.score || 0, serverRecord.score || 0)
        });
      }
    }

    const merged = Array.from(mergedMap.values());
    merged.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.date || 0).getTime() || 0;
      const timeB = new Date(b.timestamp || b.date || 0).getTime() || 0;
      return timeB - timeA;
    });

    if (persistLocal) {
      const storageKey = `${MATCH_STORAGE_PREFIX}${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(merged.slice(0, 100)));
    }
    return merged;
  } catch (err) {
    console.warn('Failed to merge server history:', err);
    return localHistory;
  }
}
