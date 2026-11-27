import { getStoredMatchHistory } from '../api/matchHistory';

export const DAILY_GAMES = [
  {
    id: 'six-degrees',
    path: '/beat-otara',
    name: 'Beat Otara',
    shortName: 'Beat Otara',
    tagline: 'Connect two Hollywood stars in the fewest film hops.'
  },
  {
    id: 'frame-sleuth',
    path: '/frame-sleuth',
    name: 'Frame Sleuth',
    shortName: 'Frame Sleuth',
    tagline: 'Identify today’s mystery film across 6 progressive camera zoom-outs.'
  },
  {
    id: 'timecode',
    path: '/timecode',
    name: 'Timecode',
    shortName: 'Timecode',
    tagline: 'Dial any timestamp to read that scene’s dialogue and deduce the film.'
  },
  {
    id: 'spotle',
    path: '/spotle',
    name: 'Spotle',
    shortName: 'Spotle',
    tagline: 'Deduce the secret movie in 10 guesses using attribute clues.'
  },
  {
    id: 'box-office',
    path: '/box-office',
    name: 'Box Office Clash',
    shortName: 'Box Office',
    tagline: 'Guess which blockbuster grossed more worldwide across 5 rounds.'
  }
];

const PROGRESS_EVENT = 'reelquest:daily-progress';

export function notifyDailyProgressChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

export function subscribeDailyProgress(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(PROGRESS_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function safeParse(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getDailyGamesStatus(userId = null, todayStr = new Date().toISOString().slice(0, 10)) {
  const status = {
    'six-degrees': { done: false, won: false, summary: null },
    'frame-sleuth': { done: false, won: false, summary: null },
    timecode: { done: false, won: false, summary: null },
    spotle: { done: false, won: false, summary: null },
    'box-office': { done: false, won: false, summary: null }
  };

  if (typeof window === 'undefined') return status;

  const otaraSession = safeParse(`reelquest_session_daily-${todayStr}`);
  if (otaraSession && (otaraSession.gameStatus === 'WON' || otaraSession.gameStatus === 'GAVE_UP')) {
    const won = otaraSession.gameStatus === 'WON';
    status['six-degrees'] = {
      done: true,
      won,
      summary: won ? `Solved in ${otaraSession.moves || 2} hops` : 'Completed'
    };
  }

  const sleuthSession = safeParse(`reelquest_framesleuth_${todayStr}`);
  if (sleuthSession && (sleuthSession.status === 'WON' || sleuthSession.status === 'LOST')) {
    const won = sleuthSession.status === 'WON';
    const count = Array.isArray(sleuthSession.guesses) ? sleuthSession.guesses.length : 1;
    status['frame-sleuth'] = {
      done: true,
      won,
      summary: won ? `Frame ${count}/6` : 'Missed (6/6)'
    };
  }

  const timecodeSession = safeParse(`reelquest_timecode_${todayStr}`);
  if (timecodeSession && (timecodeSession.status === 'WON' || timecodeSession.status === 'LOST')) {
    const won = timecodeSession.status === 'WON';
    const count = Math.max(
      1,
      Array.isArray(timecodeSession.guesses) ? timecodeSession.guesses.length : 0,
      Array.isArray(timecodeSession.probes) ? timecodeSession.probes.length : 0
    );
    status.timecode = {
      done: true,
      won,
      summary: won ? `Probe ${count}/6` : 'Missed (6/6)'
    };
  }

  const spotleSession = safeParse(`reelquest_spotle_${todayStr}`);
  if (spotleSession && (spotleSession.status === 'WON' || spotleSession.status === 'LOST')) {
    const won = spotleSession.status === 'WON';
    const count = Array.isArray(spotleSession.guesses) ? spotleSession.guesses.length : 1;
    status.spotle = {
      done: true,
      won,
      summary: won ? `Solved in ${count}/10` : 'Missed (10/10)'
    };
  }

  const boSession = safeParse(`reelquest_bo_daily_${todayStr}`);
  if (boSession && boSession.complete) {
    const score = typeof boSession.score === 'number'
      ? boSession.score
      : (Array.isArray(boSession.guesses) ? boSession.guesses.filter((g) => g.correct).length : 0);
    status['box-office'] = {
      done: true,
      won: score >= 3,
      summary: `Score ${score}/5`
    };
  }

  if (userId) {
    const history = getStoredMatchHistory(userId);
    for (const m of history) {
      if (!m || m.date !== todayStr) continue;
      const mode = m.gameMode || 'six-degrees';
      if (status[mode] && !status[mode].done) {
        status[mode] = {
          done: true,
          won: Boolean(m.won),
          summary: mode === 'frame-sleuth'
            ? (m.won ? `Frame ${m.framesUsed || m.hops || 1}/6` : 'Completed')
            : mode === 'timecode'
              ? (m.won ? `Probe ${m.hops || 1}/6` : 'Completed')
              : mode === 'spotle'
                ? (m.won ? `Solved in ${m.hops || 1}/10` : 'Completed')
                : mode === 'box-office'
                  ? `Score ${m.boxOfficeScore ?? m.hops ?? 0}/5`
                  : (m.won ? `Solved in ${m.hops || 2} hops` : 'Completed')
        };
      }
    }
  }

  return status;
}

export function getNextUnplayedDailyGame(currentMode, userId = null, todayStr = new Date().toISOString().slice(0, 10)) {
  const status = getDailyGamesStatus(userId, todayStr);
  const currentIdx = DAILY_GAMES.findIndex((g) => g.id === currentMode);
  const ordered = currentIdx >= 0
    ? [...DAILY_GAMES.slice(currentIdx + 1), ...DAILY_GAMES.slice(0, currentIdx)]
    : DAILY_GAMES;

  for (const game of ordered) {
    if (!status[game.id]?.done) {
      return game;
    }
  }
  return null;
}
