import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Clock,
  Search,
  Film,
  Trophy,
  Calendar,
  Sparkles,
  Share2,
  X,
  Flag,
  SkipForward,
  Lock,
  Eye,
  EyeOff,
  Play,
  Shuffle,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { saveDetailedMatch } from '../api/matchHistory';
import { recordLeaderboardScore } from '../api/leaderboardService';
import { getTimecodeMovieForDate, TIMECODE_MOVIES } from '../data/timecodeMovies';
import { SPOTLE_MOVIES } from '../data/spotleMovies';
import { TimecodeArchiveModal } from './TimecodeArchiveModal';
import { DailyDateNavigator } from './DailyDateNavigator';
import { NextDailyGameBar } from './NextDailyGameBar';
import {
  playClick,
  playNodeConnect,
  playVictory,
  playDefeat
} from '../utils/soundEffects';

const MAX_PROBES = 6;
const INITIAL_CEILING_SEC = 12600;

const CHAR_BADGE_STYLES = [
  'bg-amber-500/15 text-amber-300 border-amber-400/35',
  'bg-cyan-500/15 text-cyan-300 border-cyan-400/35',
  'bg-emerald-500/15 text-emerald-300 border-emerald-400/35',
  'bg-violet-500/15 text-violet-300 border-violet-400/35',
  'bg-rose-500/15 text-rose-300 border-rose-400/35',
  'bg-sky-500/15 text-sky-300 border-sky-400/35',
  'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/35',
  'bg-lime-500/15 text-lime-300 border-lime-400/35'
];

function formatHms(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function extractSceneWindow(scriptData, targetSec) {
  const cues = scriptData?.cues || [];
  if (cues.length === 0) return null;

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < cues.length; i++) {
    const dist = Math.abs(cues[i][0] - targetSec);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  const startIdx = Math.max(0, bestIdx - 1);
  const picked = [];
  const baseSec = cues[startIdx][0];
  for (let i = startIdx; i < cues.length && picked.length < 7; i++) {
    if (picked.length >= 3 && cues[i][0] - baseSec > 52) break;
    picked.push({
      sec: cues[i][0],
      speakerIdx: cues[i][1],
      text: cues[i][2]
    });
  }

  const actualSec = picked[0]?.sec ?? targetSec;
  const snapped = Math.abs(actualSec - targetSec) > 18;

  return {
    requestedSec: targetSec,
    actualSec,
    snapped,
    lines: picked
  };
}

function TokenizedDialogueLine({ rawText, showNames, chars }) {
  const parts = useMemo(() => {
    const tokens = [];
    const re = /\{\{(\d+)\|([^}]+)\}\}/g;
    let lastIdx = 0;
    let match;
    while ((match = re.exec(rawText)) !== null) {
      if (match.index > lastIdx) {
        tokens.push({ type: 'text', value: rawText.slice(lastIdx, match.index) });
      }
      tokens.push({
        type: 'char',
        charIdx: Number(match[1]),
        original: match[2]
      });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < rawText.length) {
      tokens.push({ type: 'text', value: rawText.slice(lastIdx) });
    }
    return tokens;
  }, [rawText]);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return <React.Fragment key={idx}>{part.value}</React.Fragment>;
        }
        const style = CHAR_BADGE_STYLES[part.charIdx % CHAR_BADGE_STYLES.length];
        const label = showNames
          ? part.original
          : `CHAR #${part.charIdx + 1}`;
        return (
          <span
            key={idx}
            title={
              showNames
                ? `Character: ${chars?.[part.charIdx] || part.original}`
                : 'Character name hidden (toggle Reveal Names above)'
            }
            className={`inline-flex items-center rounded-md border px-1.5 py-0.2 mx-0.5 text-[11px] font-bold tracking-tight align-baseline transition-all ${style}`}
          >
            {label}
          </span>
        );
      })}
    </span>
  );
}

export function TimecodeGameView({ onOpenPro, onSelectGame, onOpenLeaderboard }) {
  const { user, isPro } = useAuth();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeDate, setActiveDate] = useState(todayStr);
  const isToday = activeDate === todayStr;

  const targetMovie = useMemo(() => getTimecodeMovieForDate(activeDate), [activeDate]);

  const [scriptData, setScriptData] = useState(null);
  const [scriptLoading, setScriptLoading] = useState(true);
  const [scriptError, setScriptError] = useState(false);

  const [probes, setProbes] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('PLAYING');
  const [viewedProbeIndex, setViewedProbeIndex] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [showCharacterNames, setShowCharacterNames] = useState(false);
  const [everRevealedNames, setEverRevealedNames] = useState(false);
  const [ceilingSec, setCeilingSec] = useState(INITIAL_CEILING_SEC);
  const [freeOutOfBoundsUsed, setFreeOutOfBoundsUsed] = useState(false);
  const [timelineNotice, setTimelineNotice] = useState(null);

  const [hoursInput, setHoursInput] = useState('00');
  const [minutesInput, setMinutesInput] = useState('35');
  const [secondsInput, setSecondsInput] = useState('00');

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showResultModal, setShowResultModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const searchInputRef = useRef(null);

  const searchableMovies = useMemo(() => {
    const byTitle = new Map();
    for (const m of SPOTLE_MOVIES) {
      byTitle.set(m.title.toLowerCase(), m);
    }
    for (const m of TIMECODE_MOVIES) {
      if (!byTitle.has(m.title.toLowerCase())) {
        byTitle.set(m.title.toLowerCase(), m);
      }
    }
    return Array.from(byTitle.values());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setScriptLoading(true);
    setScriptError(false);

    fetch(`/data/timecode/${targetMovie.scriptKey}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Script missing');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setScriptData(data);
        setScriptLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setScriptError(true);
        setScriptLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetMovie.scriptKey]);

  useEffect(() => {
    setTimelineNotice(null);
    try {
      const storageKey = `reelquest_timecode_${activeDate}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const savedProbes = parsed.probes || [];
        setProbes(savedProbes);
        setGuesses(parsed.guesses || []);
        setGameStatus(parsed.status || 'PLAYING');
        setGaveUp(Boolean(parsed.gaveUp));
        setTimerSeconds(parsed.timerSeconds || 0);
        setEverRevealedNames(Boolean(parsed.everRevealedNames));
        setShowCharacterNames(Boolean(parsed.showCharacterNames || parsed.status === 'WON' || parsed.status === 'LOST'));
        setCeilingSec(parsed.ceilingSec || INITIAL_CEILING_SEC);
        setFreeOutOfBoundsUsed(Boolean(parsed.freeOutOfBoundsUsed));
        setViewedProbeIndex(Math.max(0, savedProbes.length - 1));
        setShowResultModal(parsed.status === 'WON' || parsed.status === 'LOST');
      } else {
        setProbes([]);
        setGuesses([]);
        setGameStatus('PLAYING');
        setGaveUp(false);
        setTimerSeconds(0);
        setEverRevealedNames(false);
        setShowCharacterNames(false);
        setCeilingSec(INITIAL_CEILING_SEC);
        setFreeOutOfBoundsUsed(false);
        setViewedProbeIndex(0);
        setShowResultModal(false);
      }
    } catch {
      setProbes([]);
      setGuesses([]);
      setGameStatus('PLAYING');
      setGaveUp(false);
      setTimerSeconds(0);
      setEverRevealedNames(false);
      setShowCharacterNames(false);
      setCeilingSec(INITIAL_CEILING_SEC);
      setFreeOutOfBoundsUsed(false);
      setViewedProbeIndex(0);
      setShowResultModal(false);
    }
  }, [activeDate]);

  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  const persistSession = (overrides = {}) => {
    const storageKey = `reelquest_timecode_${activeDate}`;
    const nextPayload = {
      date: activeDate,
      probes,
      guesses,
      status: gameStatus,
      gaveUp,
      timerSeconds: Math.max(1, timerSeconds),
      everRevealedNames,
      showCharacterNames,
      ceilingSec,
      freeOutOfBoundsUsed,
      updatedAt: new Date().toISOString(),
      ...overrides
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextPayload));
    } catch {}
  };

  const maxAllowedProbes = gameStatus === 'PLAYING'
    ? Math.min(MAX_PROBES, guesses.length + 1)
    : MAX_PROBES;

  const canProbeNow = gameStatus === 'PLAYING' && !scriptLoading && scriptData && probes.length < maxAllowedProbes;

  const currentDialSeconds = useMemo(() => {
    const h = Math.max(0, Math.min(4, parseInt(hoursInput || '0', 10) || 0));
    const m = Math.max(0, Math.min(59, parseInt(minutesInput || '0', 10) || 0));
    const s = Math.max(0, Math.min(59, parseInt(secondsInput || '0', 10) || 0));
    return h * 3600 + m * 60 + s;
  }, [hoursInput, minutesInput, secondsInput]);

  const syncInputsFromSeconds = (sec) => {
    const clamped = Math.max(60, Math.min(ceilingSec, Math.round(sec)));
    const h = Math.floor(clamped / 3600);
    const m = Math.floor((clamped % 3600) / 60);
    const s = clamped % 60;
    setHoursInput(String(h).padStart(2, '0'));
    setMinutesInput(String(m).padStart(2, '0'));
    setSecondsInput(String(s).padStart(2, '0'));
  };

  const handleToggleCharacterNames = () => {
    playClick();
    const nextVisible = !showCharacterNames;
    const nextEver = everRevealedNames || (gameStatus === 'PLAYING' && nextVisible);
    setShowCharacterNames(nextVisible);
    if (nextEver !== everRevealedNames) {
      setEverRevealedNames(true);
    }
    persistSession({
      showCharacterNames: nextVisible,
      everRevealedNames: nextEver
    });
  };

  const handleProbeTimestamp = (explicitSec = null) => {
    if (!canProbeNow || !scriptData) return;
    const requested = Math.max(45, explicitSec !== null ? explicitSec : currentDialSeconds);

    if (probes.some((p) => Math.abs(p.requestedSec - requested) < 15)) {
      setTimelineNotice({
        type: 'info',
        text: `You already probed near ${formatHms(requested)}. Try another moment on the timeline.`
      });
      return;
    }

    const actualDuration = scriptData.dur || targetMovie.runtime * 60;
    if (requested > actualDuration) {
      playClick();
      const newCeiling = Math.min(ceilingSec, requested);
      setCeilingSec(newCeiling);
      syncInputsFromSeconds(Math.max(120, newCeiling - 900));

      if (!freeOutOfBoundsUsed) {
        setFreeOutOfBoundsUsed(true);
        setTimelineNotice({
          type: 'warning',
          text: `At ${formatHms(requested)} the credits have already finished! Timeline narrowed (free runtime check — probe saved).`
        });
        persistSession({
          ceilingSec: newCeiling,
          freeOutOfBoundsUsed: true
        });
        return;
      }

      const clampedTarget = Math.max(90, actualDuration - 180);
      const fallbackScene = extractSceneWindow(scriptData, clampedTarget);
      if (fallbackScene) {
        const updatedProbes = [...probes, { ...fallbackScene, requestedSec: requested, snapped: true }];
        setProbes(updatedProbes);
        setViewedProbeIndex(updatedProbes.length - 1);
        setTimelineNotice({
          type: 'warning',
          text: `${formatHms(requested)} exceeded runtime — jumped to the final act (${formatHms(fallbackScene.actualSec)}).`
        });
        playNodeConnect();
        persistSession({
          probes: updatedProbes,
          ceilingSec: actualDuration
        });
      }
      return;
    }

    const scene = extractSceneWindow(scriptData, requested);
    if (!scene) return;

    const nextProbes = [...probes, scene];
    setProbes(nextProbes);
    setViewedProbeIndex(nextProbes.length - 1);
    playNodeConnect();

    if (scene.snapped) {
      setTimelineNotice({
        type: 'info',
        text: `No dialogue right at ${formatHms(requested)} — snapped to nearest dialogue scene at ${formatHms(scene.actualSec)}.`
      });
    } else {
      setTimelineNotice(null);
    }

    persistSession({ probes: nextProbes });
  };

  const handleRandomProbe = () => {
    if (!canProbeNow || !scriptData) return;
    const maxBound = Math.min(ceilingSec, scriptData.dur || 6600);
    let candidate = Math.floor(180 + Math.random() * Math.max(600, maxBound - 360));
    for (let attempt = 0; attempt < 8; attempt++) {
      const cand = Math.floor(180 + Math.random() * Math.max(600, maxBound - 360));
      if (!probes.some((p) => Math.abs(p.actualSec - cand) < 240)) {
        candidate = cand;
        break;
      }
    }
    syncInputsFromSeconds(candidate);
    handleProbeTimestamp(candidate);
  };

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const matched = [];
    for (let i = 0; i < searchableMovies.length; i++) {
      const m = searchableMovies[i];
      const titleLower = m.title.toLowerCase();
      if (titleLower.includes(q) || (m.director && m.director.toLowerCase().includes(q))) {
        matched.push({
          movie: m,
          exact: titleLower === q,
          startsWith: titleLower.startsWith(q)
        });
      }
    }
    matched.sort((a, b) => {
      if (a.exact !== b.exact) return a.exact ? -1 : 1;
      if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
      return (b.movie.rating || 0) - (a.movie.rating || 0);
    });
    return matched.slice(0, 8).map((item) => item.movie);
  }, [searchQuery, searchableMovies]);

  const finalizeMatchOutcome = (won, finalGuesses, forfeited = false) => {
    const finalDuration = Math.max(1, timerSeconds);
    const probesCount = won
      ? Math.max(1, Math.max(finalGuesses.length, probes.length))
      : MAX_PROBES;

    const pureScore = Math.max(200, 1000 - (probesCount - 1) * 140);
    const computedScore = won
      ? (everRevealedNames ? Math.max(120, pureScore - 150) : pureScore)
      : 0;

    saveDetailedMatch(user?.id, {
      id: `timecode_${activeDate}_${user?.id || 'guest'}`,
      gameMode: 'timecode',
      subMode: isToday ? 'daily' : 'archive',
      date: activeDate,
      won,
      forfeited,
      hops: probesCount,
      optimalHops: 1,
      usedHint: everRevealedNames,
      durationSeconds: finalDuration,
      targetMovie: {
        id: targetMovie.id,
        title: targetMovie.title,
        year: targetMovie.year,
        director: targetMovie.director,
        posterPath: targetMovie.posterPath
      },
      guesses: finalGuesses.map((g) => (g.skipped ? 'Skipped' : g.title))
    });

    if (won && user?.id) {
      recordLeaderboardScore('timecode', {
        userId: user.id,
        username: user.username,
        isPro: user.isPro,
        hops: probesCount,
        score: computedScore,
        usedHint: everRevealedNames,
        durationSeconds: finalDuration,
        date: activeDate,
        subMode: isToday ? 'daily' : 'archive',
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        }
      });
    }
  };

  const handleGuessMovie = (movie) => {
    if (gameStatus !== 'PLAYING') return;
    if (guesses.some((g) => !g.skipped && g.title.toLowerCase() === movie.title.toLowerCase())) {
      setSearchQuery('');
      setDropdownOpen(false);
      return;
    }

    const isWin = movie.title.toLowerCase().trim() === targetMovie.title.toLowerCase().trim();
    const newGuess = {
      title: movie.title,
      year: movie.year,
      posterPath: movie.posterPath,
      won: isWin,
      skipped: false
    };

    const newGuesses = [...guesses, newGuess];
    const isLoss = !isWin && newGuesses.length >= MAX_PROBES;
    const nextStatus = isWin ? 'WON' : isLoss ? 'LOST' : 'PLAYING';

    setGuesses(newGuesses);
    setGameStatus(nextStatus);
    setSearchQuery('');
    setDropdownOpen(false);

    if (isWin) {
      playVictory();
      setShowCharacterNames(true);
      setShowResultModal(true);
      persistSession({
        guesses: newGuesses,
        status: 'WON',
        showCharacterNames: true
      });
      finalizeMatchOutcome(true, newGuesses, false);
    } else if (isLoss) {
      playDefeat();
      setShowCharacterNames(true);
      setShowResultModal(true);
      persistSession({
        guesses: newGuesses,
        status: 'LOST',
        showCharacterNames: true
      });
      finalizeMatchOutcome(false, newGuesses, false);
    } else {
      playClick();
      setTimelineNotice({
        type: 'info',
        text: `Not "${movie.title}". Probe #${newGuesses.length + 1} of ${MAX_PROBES} is now unlocked — pick another timestamp!`
      });
      persistSession({ guesses: newGuesses });
    }
  };

  const handleSkipAttempt = () => {
    if (gameStatus !== 'PLAYING') return;
    playClick();

    const newGuesses = [
      ...guesses,
      { title: 'Skipped', skipped: true, won: false }
    ];
    const isLoss = newGuesses.length >= MAX_PROBES;
    const nextStatus = isLoss ? 'LOST' : 'PLAYING';

    setGuesses(newGuesses);
    setGameStatus(nextStatus);

    if (isLoss) {
      playDefeat();
      setShowCharacterNames(true);
      setShowResultModal(true);
      persistSession({
        guesses: newGuesses,
        status: 'LOST',
        showCharacterNames: true
      });
      finalizeMatchOutcome(false, newGuesses, false);
    } else {
      setTimelineNotice({
        type: 'info',
        text: `Probe #${newGuesses.length + 1} of ${MAX_PROBES} unlocked — dial a new timestamp above.`
      });
      persistSession({ guesses: newGuesses });
    }
  };

  const handleGiveUp = () => {
    if (gameStatus !== 'PLAYING') return;
    playDefeat();
    setGaveUp(true);
    setGameStatus('LOST');
    setShowCharacterNames(true);
    setShowResultModal(true);
    persistSession({
      status: 'LOST',
      gaveUp: true,
      showCharacterNames: true
    });
    finalizeMatchOutcome(false, guesses, true);
  };

  const handleSearchKeyDown = (e) => {
    if (!dropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        handleGuessMovie(suggestions[0]);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        handleGuessMovie(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const handleShare = () => {
    playClick();
    const solvedProbes = Math.max(1, Math.max(guesses.length, probes.length));
    const lines = [];
    lines.push(`ReelQuest Timecode #${activeDate} ⏱️`);
    if (gameStatus === 'WON') {
      lines.push(
        `🎬 Solved in ${solvedProbes}/${MAX_PROBES} probes ${everRevealedNames ? '(Names Revealed)' : '• Pure Mode 🕵️'}`
      );
    } else {
      lines.push(`❌ Unsolved (${MAX_PROBES}/${MAX_PROBES})`);
    }
    lines.push('');

    const probedStamps = probes.map((p) => formatHms(p.actualSec)).join(' → ');
    if (probedStamps) {
      lines.push(`⏱️ ${probedStamps}`);
    }

    let blocks = '';
    for (let i = 0; i < MAX_PROBES; i++) {
      if (i < guesses.length) {
        const g = guesses[i];
        if (g.won) blocks += '🟩';
        else if (g.skipped) blocks += '🟨';
        else blocks += '🟥';
      } else {
        blocks += '⬛';
      }
    }
    lines.push(blocks);
    lines.push('');
    lines.push('Play: https://reelquest.io/timecode');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const activeProbe = probes[viewedProbeIndex] || null;
  const canUnlockEraGenre = isPro || gameStatus !== 'PLAYING' || guesses.length >= 2;
  const canUnlockDirector = isPro || gameStatus !== 'PLAYING' || guesses.length >= 4;
  const formattedTimer = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;
  const solvedProbesCount = Math.max(1, Math.max(guesses.length, probes.length));

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8 animate-fade-in">
      <DailyDateNavigator
        currentDate={activeDate}
        onSelectDate={(newDate) => {
          playClick();
          setActiveDate(newDate);
        }}
        onOpenArchive={() => {
          playClick();
          setShowArchiveModal(true);
        }}
        onOpenHowToPlay={() => {
          playClick();
          setShowHowToPlay(true);
        }}
        rightExtra={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-mono text-cinema-muted">
              <Clock className="h-3.5 w-3.5 text-gold" />
              <span>{formattedTimer}</span>
            </span>
            {gameStatus !== 'PLAYING' && (
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowResultModal(true);
                }}
                className="flex h-7 items-center gap-1 rounded-lg bg-gold px-2.5 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition"
              >
                <Trophy className="h-3.5 w-3.5" />
                <span>Result</span>
              </button>
            )}
          </div>
        }
      />

      <div className="rounded-2xl border border-white/[0.1] bg-cinema-surface p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-gold/15 border border-gold/30 px-2.5 py-1 text-[11px] font-extrabold text-gold uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Probe {Math.min(MAX_PROBES, probes.length + (canProbeNow ? 1 : 0))} of {MAX_PROBES}</span>
            </span>
            <span className="text-xs text-cinema-muted">
              {canProbeNow
                ? 'Dial any timestamp to inspect that moment in the film'
                : gameStatus === 'PLAYING'
                  ? 'Make a movie guess (or skip) to unlock your next probe'
                  : `Runtime: ${formatHms(scriptData?.dur || targetMovie.runtime * 60)}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleCharacterNames}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
              showCharacterNames
                ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60'
            }`}
            title="Show or hide character names across all probed scenes"
          >
            {showCharacterNames ? (
              <>
                <Eye className="h-3.5 w-3.5 text-amber-300" />
                <span>Names: Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-emerald-300" />
                <span>Names: Hidden</span>
              </>
            )}
            <span className={`ml-1 rounded px-1.5 py-0.2 text-[10px] font-extrabold ${
              everRevealedNames
                ? 'bg-amber-400/20 text-amber-200'
                : 'bg-emerald-400/20 text-emerald-200'
            }`}>
              {everRevealedNames ? 'Assisted' : 'Pure'}
            </span>
          </button>
        </div>

        {gameStatus === 'PLAYING' && (
          <div className="space-y-3 rounded-xl border border-white/[0.08] bg-cinema-black/60 p-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-cinema-card px-3 py-1.5 font-mono text-base font-extrabold text-white">
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={hoursInput}
                    disabled={!canProbeNow}
                    onChange={(e) => setHoursInput(e.target.value.slice(0, 2))}
                    onBlur={() => setHoursInput(String(Math.max(0, Math.min(4, parseInt(hoursInput || '0', 10) || 0))).padStart(2, '0'))}
                    aria-label="Hours"
                    className="w-8 bg-transparent text-center focus:outline-none focus:text-gold disabled:opacity-45"
                  />
                  <span className="text-gold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={minutesInput}
                    disabled={!canProbeNow}
                    onChange={(e) => setMinutesInput(e.target.value.slice(0, 2))}
                    onBlur={() => setMinutesInput(String(Math.max(0, Math.min(59, parseInt(minutesInput || '0', 10) || 0))).padStart(2, '0'))}
                    aria-label="Minutes"
                    className="w-8 bg-transparent text-center focus:outline-none focus:text-gold disabled:opacity-45"
                  />
                  <span className="text-gold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={secondsInput}
                    disabled={!canProbeNow}
                    onChange={(e) => setSecondsInput(e.target.value.slice(0, 2))}
                    onBlur={() => setSecondsInput(String(Math.max(0, Math.min(59, parseInt(secondsInput || '0', 10) || 0))).padStart(2, '0'))}
                    aria-label="Seconds"
                    className="w-8 bg-transparent text-center focus:outline-none focus:text-gold disabled:opacity-45"
                  />
                </div>

                <div className="hidden md:flex items-center gap-1 pl-1">
                  {[
                    { label: '00:10', sec: 600 },
                    { label: '00:35', sec: 2100 },
                    { label: '01:05', sec: 3900 },
                    { label: '01:35', sec: 5700 }
                  ].filter((p) => p.sec <= ceilingSec).map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      disabled={!canProbeNow}
                      onClick={() => {
                        playClick();
                        syncInputsFromSeconds(preset.sec);
                      }}
                      className="rounded-lg border border-white/10 bg-cinema-surface px-2 py-1 font-mono text-[11px] font-semibold text-cinema-muted hover:text-white hover:border-white/25 disabled:opacity-40 transition"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canProbeNow}
                  onClick={() => handleProbeTimestamp()}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-cinema-black" />
                  <span>Probe Timecode</span>
                </button>

                <button
                  type="button"
                  disabled={!canProbeNow}
                  onClick={handleRandomProbe}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-cinema-card px-3 py-2 text-xs font-semibold text-slate-200 hover:border-gold/50 hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Jump to a random unprobed scene"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Random</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="relative flex items-center">
                <input
                  type="range"
                  min={60}
                  max={ceilingSec}
                  step={15}
                  disabled={!canProbeNow}
                  value={Math.min(ceilingSec, Math.max(60, currentDialSeconds))}
                  onChange={(e) => syncInputsFromSeconds(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer disabled:opacity-45"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-cinema-muted">
                <span>00:01:00</span>
                <span className="text-slate-300 font-semibold">
                  Selected: {formatHms(currentDialSeconds)}
                </span>
                <span>
                  {ceilingSec < INITIAL_CEILING_SEC
                    ? `Max < ${formatHms(ceilingSec)}`
                    : '03:30:00?'}
                </span>
              </div>
            </div>
          </div>
        )}

        {timelineNotice && (
          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
            timelineNotice.type === 'warning'
              ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
              : 'border-sky-500/30 bg-sky-500/10 text-sky-200'
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{timelineNotice.text}</span>
          </div>
        )}

        {probes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {probes.map((p, idx) => {
              const isCurrent = idx === viewedProbeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    playClick();
                    setViewedProbeIndex(idx);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${
                    isCurrent
                      ? 'border-gold bg-gold text-cinema-black'
                      : 'border-white/15 bg-cinema-black/60 text-slate-300 hover:border-white/35 hover:text-white'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span>{formatHms(p.actualSec)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="rounded-xl border border-white/[0.08] bg-[#0a0d14] p-4 sm:p-5 min-h-[210px] flex flex-col justify-center">
          {scriptLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gold py-10">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Loading daily screenplay reel...</span>
            </div>
          ) : scriptError ? (
            <div className="text-center text-xs text-rose-400 py-8">
              Unable to load screenplay reel. Please refresh.
            </div>
          ) : !activeProbe ? (
            <div className="text-center space-y-2.5 py-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 border border-gold/25 text-gold">
                <FileText className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-white">
                Pick Your Opening Timestamp
              </p>
              <p className="text-xs text-cinema-muted max-w-md mx-auto leading-relaxed">
                Enter any exact timecode above (for example <span className="font-mono text-slate-200">00:35:00</span>) and hit <strong className="text-gold">Probe Timecode</strong> to read the dialogue spoken at that moment in today&apos;s secret film.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2 text-[11px] font-mono text-cinema-muted">
                <span>
                  SCENE EXCERPT • {formatHms(activeProbe.lines[0]?.sec || activeProbe.actualSec)} — {formatHms(activeProbe.lines[activeProbe.lines.length - 1]?.sec || activeProbe.actualSec)}
                </span>
                <span className="text-gold font-bold">
                  Probe #{viewedProbeIndex + 1}
                </span>
              </div>

              <div className="space-y-2.5">
                {activeProbe.lines.map((line, lIdx) => {
                  const spkIdx = line.speakerIdx;
                  const hasSpeaker = typeof spkIdx === 'number' && spkIdx >= 0;
                  const spkStyle = hasSpeaker
                    ? CHAR_BADGE_STYLES[spkIdx % CHAR_BADGE_STYLES.length]
                    : '';
                  const spkName = hasSpeaker
                    ? (showCharacterNames
                        ? (scriptData?.chars?.[spkIdx] || `CHAR #${spkIdx + 1}`).toUpperCase()
                        : `CHAR #${spkIdx + 1}`)
                    : null;

                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-3 py-2 border border-white/[0.04]"
                    >
                      <span className="font-mono text-[11px] text-slate-500 shrink-0 pt-0.5">
                        {formatHms(line.sec)}
                      </span>
                      <div className="text-xs sm:text-sm text-slate-100 leading-relaxed flex-1">
                        {spkName && (
                          <span className={`inline-flex items-center rounded border px-1.5 py-0.2 mr-2 text-[10px] font-extrabold uppercase tracking-wider ${spkStyle}`}>
                            {spkName}
                          </span>
                        )}
                        <TokenizedDialogueLine
                          rawText={line.text}
                          showNames={showCharacterNames}
                          chars={scriptData?.chars}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {gameStatus === 'PLAYING' ? (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 relative">
            <div className="relative flex-1">
              <div className="relative flex items-center rounded-xl border border-white/[0.14] bg-cinema-surface px-3.5 transition focus-within:border-gold/70">
                <Search className="h-4 w-4 text-gold shrink-0 mr-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDropdownOpen(true);
                    setSelectedIndex(0);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    probes.length === 0
                      ? 'Probe a timestamp above first, or take an early shot...'
                      : `Guess the film (Attempt ${guesses.length + 1} of ${MAX_PROBES})...`
                  }
                  className="w-full bg-transparent py-2.5 text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDropdownOpen(false);
                    }}
                    className="p-1 text-cinema-muted hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {dropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-cinema-card/98 p-1.5 shadow-2xl backdrop-blur-lg">
                  {suggestions.map((movie, idx) => {
                    const isSelected = idx === selectedIndex;
                    const alreadyGuessed = guesses.some(
                      (g) => !g.skipped && g.title.toLowerCase() === movie.title.toLowerCase()
                    );

                    return (
                      <div
                        key={movie.id}
                        onClick={() => {
                          if (!alreadyGuessed) {
                            handleGuessMovie(movie);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg transition cursor-pointer ${
                          isSelected
                            ? 'bg-gold/15 text-white'
                            : 'hover:bg-white/[0.05] text-slate-200'
                        } ${alreadyGuessed ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-6 shrink-0 overflow-hidden rounded bg-black/50 border border-white/10">
                            {movie.posterPath ? (
                              <img
                                src={getTmdbImageUrl(movie.posterPath)}
                                alt={movie.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Film className="h-full w-full p-1 text-cinema-muted" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-semibold block truncate text-white">
                              {movie.title}
                            </span>
                            <span className="text-[11px] text-cinema-muted">{movie.year}</span>
                          </div>
                        </div>

                        {alreadyGuessed ? (
                          <span className="text-[11px] font-semibold text-cinema-muted">Guessed</span>
                        ) : (
                          <span className="text-[11px] font-bold text-gold">Select</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSkipAttempt}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-cinema-surface hover:border-white/25 hover:text-white text-slate-200 px-3.5 py-2.5 text-xs font-semibold transition active:scale-95"
                title="Skip guess to unlock next timestamp probe"
              >
                <SkipForward className="h-3.5 w-3.5 text-gold" />
                <span>Next Probe</span>
              </button>

              <button
                type="button"
                onClick={handleGiveUp}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-cinema-surface hover:border-rose-500/40 hover:bg-rose-500/10 text-rose-400 px-3.5 py-2.5 text-xs font-semibold transition active:scale-95"
                title="Give up and reveal secret movie"
              >
                <Flag className="h-3.5 w-3.5" />
                <span>Give Up</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                canUnlockEraGenre
                  ? 'border-gold/30 bg-gold/[0.07] text-slate-100'
                  : 'border-white/[0.07] bg-cinema-surface/60 text-cinema-muted'
              }`}>
                {canUnlockEraGenre ? (
                  <>
                    <Sparkles className="h-3 w-3 text-gold shrink-0" />
                    <span className="font-semibold">
                      {Math.floor(targetMovie.year / 10) * 10}s • {(targetMovie.genres || []).join(', ')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                    <span>Era &amp; Genre at Probe 3</span>
                  </>
                )}
              </div>

              <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${
                canUnlockDirector
                  ? 'border-gold/30 bg-gold/[0.07] text-slate-100'
                  : 'border-white/[0.07] bg-cinema-surface/60 text-cinema-muted'
              }`}>
                {canUnlockDirector ? (
                  <>
                    <Sparkles className="h-3 w-3 text-gold shrink-0" />
                    <span className="font-semibold">Dir. {targetMovie.director}</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                    <span>Director at Probe 5</span>
                  </>
                )}
              </div>
            </div>

            {guesses.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-cinema-muted">
                <span>Tried:</span>
                {guesses.map((g, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      g.skipped
                        ? 'bg-white/[0.05] text-slate-400'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {g.skipped ? `Skip #${i + 1}` : g.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`rounded-2xl border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              gameStatus === 'WON'
                ? 'border-emerald-500/35 bg-emerald-500/[0.08]'
                : 'border-rose-500/35 bg-rose-500/[0.08]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                  gameStatus === 'WON'
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                }`}
              >
                {gameStatus === 'WON' ? (
                  <Trophy className="h-5 w-5 text-gold" />
                ) : (
                  <Film className="h-5 w-5 text-rose-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    {gameStatus === 'WON'
                      ? `Solved in ${solvedProbesCount} of ${MAX_PROBES} Probes`
                      : gaveUp
                        ? 'Film Revealed'
                        : 'Out of Probes'}
                  </h3>
                  {gameStatus === 'WON' && !everRevealedNames && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Pure Mode</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">{targetMovie.title}</strong> ({targetMovie.year}) • Dir. {targetMovie.director}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-cinema-black hover:bg-amber-300 transition active:scale-95"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedShare ? 'Copied!' : 'Share'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowResultModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-cinema-surface px-3.5 py-2 text-xs font-semibold text-white hover:border-white/30 transition"
              >
                <span>Film Card</span>
              </button>
            </div>
          </div>

          <NextDailyGameBar
            currentMode="timecode"
            onSelectGame={onSelectGame}
            onOpenLeaderboard={onOpenLeaderboard}
          />
        </div>
      )}

      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-cinema-card p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                    gameStatus === 'WON'
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                  }`}
                >
                  {gameStatus === 'WON' ? (
                    <Trophy className="h-4 w-4 text-gold" />
                  ) : (
                    <Film className="h-4 w-4 text-rose-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {gameStatus === 'WON'
                      ? `Solved in ${solvedProbesCount}/${MAX_PROBES} Probes`
                      : gaveUp
                        ? 'Secret Film Revealed'
                        : 'Out of Probes'}
                  </h3>
                  <span className="text-xs text-cinema-muted">
                    Timecode • {activeDate} {gameStatus === 'WON' ? (everRevealedNames ? '• Names Revealed' : '• Pure Mode') : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="p-1.5 rounded-lg text-cinema-muted hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/[0.08] bg-cinema-surface p-3.5">
              <img
                src={getTmdbImageUrl(targetMovie.posterPath)}
                alt={targetMovie.title}
                className="h-28 w-20 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <h4 className="text-base font-extrabold text-white leading-tight">
                  {targetMovie.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-cinema-muted">
                  <span>{targetMovie.year}</span>
                  <span>•</span>
                  <span>{targetMovie.runtime}m</span>
                  <span>•</span>
                  <span className="text-gold font-bold">★ {targetMovie.rating}</span>
                </div>
                <p className="text-xs text-slate-300">
                  Directed by <strong className="text-white">{targetMovie.director}</strong>
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(targetMovie.genres || []).map((g, gIdx) => (
                    <span
                      key={gIdx}
                      className="rounded-md bg-cinema-card px-2 py-0.5 text-[11px] font-semibold text-slate-300 border border-white/[0.07]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <NextDailyGameBar
              currentMode="timecode"
              compact={true}
              onSelectGame={(modeId) => {
                setShowResultModal(false);
                onSelectGame?.(modeId);
              }}
              onOpenLeaderboard={() => {
                setShowResultModal(false);
                onOpenLeaderboard?.();
              }}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-amber-300 py-2.5 text-xs font-extrabold text-cinema-black transition active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span>{copiedShare ? 'Copied!' : 'Share Result'}</span>
              </button>

              <button
                onClick={() => {
                  setShowResultModal(false);
                  setShowArchiveModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-cinema-surface py-2.5 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white transition"
              >
                <Calendar className="h-3.5 w-3.5 text-gold" />
                <span>Past Archive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-cinema-card p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-extrabold text-white">How to Play Timecode</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg text-cinema-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p><strong className="text-white">Goal:</strong> Deduce today&apos;s secret film in 6 timestamp probes or fewer.</p>
              <p><strong className="text-white">Dial Any Moment:</strong> Enter any `HH:MM:SS` timestamp (or drag the timeline) to reveal the real dialogue spoken at that moment. If you pick a timestamp past the film&apos;s runtime, you narrow down how long the movie is!</p>
              <p><strong className="text-white">Character Names Toggle:</strong> By default, character names are masked (`CHAR #1`) for <strong className="text-emerald-300">Pure Mode</strong>. You can toggle <strong className="text-amber-300">Names: Visible</strong> anytime if you want help — Pure solves rank higher on the daily leaderboard.</p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full rounded-xl bg-gold hover:bg-amber-300 py-2.5 text-xs font-extrabold text-cinema-black transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      <TimecodeArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => {
          setActiveDate(newDate);
        }}
      />
    </div>
  );
}
