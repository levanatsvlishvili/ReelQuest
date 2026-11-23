import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  Film,
  Search,
  Trophy,
  Calendar,
  Sparkles,
  Share2,
  Check,
  X,
  Flag,
  ZoomIn,
  SkipForward,
  Lock,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { saveDetailedMatch } from '../api/matchHistory';
import { recordLeaderboardScore } from '../api/leaderboardService';
import {
  getFrameSleuthMovieForDate,
  getFrameImageUrl
} from '../data/frameSleuthMovies';
import { SPOTLE_MOVIES } from '../data/spotleMovies';
import { FrameSleuthArchiveModal } from './FrameSleuthArchiveModal';
import { DailyDateNavigator } from './DailyDateNavigator';
import { NextDailyGameBar } from './NextDailyGameBar';
import {
  playClick,
  playNodeConnect,
  playVictory,
  playDefeat
} from '../utils/soundEffects';

const MAX_FRAMES = 6;

export function FrameSleuthGameView({ onOpenPro, onOpenAuth, onSelectGame, onOpenLeaderboard }) {
  const { user, isPro } = useAuth();

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeDate, setActiveDate] = useState(todayStr);
  const isToday = activeDate === todayStr;

  const targetMovie = useMemo(() => {
    return getFrameSleuthMovieForDate(activeDate);
  }, [activeDate]);

  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('PLAYING');
  const [viewedFrameIndex, setViewedFrameIndex] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [showResultModal, setShowResultModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const searchInputRef = useRef(null);

  const unlockedFramesCount = gameStatus === 'PLAYING'
    ? Math.min(MAX_FRAMES, guesses.length + 1)
    : MAX_FRAMES;

  useEffect(() => {
    try {
      const storageKey = `reelquest_framesleuth_${activeDate}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGuesses(parsed.guesses || []);
        setGameStatus(parsed.status || 'PLAYING');
        setGaveUp(Boolean(parsed.gaveUp));
        setTimerSeconds(parsed.timerSeconds || 0);
        const unlocked = Math.min(MAX_FRAMES - 1, (parsed.guesses || []).length);
        setViewedFrameIndex(unlocked);
        if (parsed.status === 'WON' || parsed.status === 'LOST') {
          setShowResultModal(true);
        } else {
          setShowResultModal(false);
        }
      } else {
        setGuesses([]);
        setGameStatus('PLAYING');
        setGaveUp(false);
        setTimerSeconds(0);
        setViewedFrameIndex(0);
        setShowResultModal(false);
      }
    } catch (e) {
      setGuesses([]);
      setGameStatus('PLAYING');
      setGaveUp(false);
      setTimerSeconds(0);
      setViewedFrameIndex(0);
      setShowResultModal(false);
    }
  }, [activeDate]);

  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  useEffect(() => {
    setImageLoading(true);
  }, [viewedFrameIndex, activeDate]);

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();
    const matched = [];
    for (let i = 0; i < SPOTLE_MOVIES.length; i++) {
      const m = SPOTLE_MOVIES[i];
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
  }, [searchQuery]);

  const handleGuessMovie = (movie) => {
    if (gameStatus !== 'PLAYING') return;

    if (guesses.some(g => !g.skipped && g.title.toLowerCase() === movie.title.toLowerCase())) {
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
    const isLoss = !isWin && newGuesses.length >= MAX_FRAMES;
    const nextStatus = isWin ? 'WON' : isLoss ? 'LOST' : 'PLAYING';

    setGuesses(newGuesses);
    setGameStatus(nextStatus);
    setSearchQuery('');
    setDropdownOpen(false);

    if (!isWin && !isLoss) {
      setViewedFrameIndex(newGuesses.length);
      playNodeConnect();
    }

    const storageKey = `reelquest_framesleuth_${activeDate}`;
    const finalDuration = Math.max(1, timerSeconds);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: activeDate,
        guesses: newGuesses,
        status: nextStatus,
        gaveUp: false,
        timerSeconds: finalDuration,
        updatedAt: new Date().toISOString()
      })
    );

    if (isWin) {
      playVictory();
      setShowResultModal(true);
      saveDetailedMatch(user?.id, {
        id: `framesleuth_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'frame-sleuth',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: true,
        forfeited: false,
        hops: newGuesses.length,
        optimalHops: 1,
        framesUsed: newGuesses.length,
        durationSeconds: finalDuration,
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        },
        guesses: newGuesses.map(g => g.skipped ? 'Skipped' : g.title)
      });
      if (user?.id) {
        recordLeaderboardScore('frame-sleuth', {
          userId: user.id,
          username: user.username,
          isPro: user.isPro,
          hops: newGuesses.length,
          score: Math.max(50, 110 - newGuesses.length * 15),
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
    } else if (isLoss) {
      playDefeat();
      setShowResultModal(true);
      saveDetailedMatch(user?.id, {
        id: `framesleuth_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'frame-sleuth',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: false,
        forfeited: false,
        hops: MAX_FRAMES,
        optimalHops: 1,
        framesUsed: MAX_FRAMES,
        durationSeconds: finalDuration,
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        },
        guesses: newGuesses.map(g => g.skipped ? 'Skipped' : g.title)
      });
    }
  };

  const handleSkipFrame = () => {
    if (gameStatus !== 'PLAYING') return;
    playClick();

    const newGuess = {
      title: 'Skipped',
      skipped: true,
      won: false
    };

    const newGuesses = [...guesses, newGuess];
    const isLoss = newGuesses.length >= MAX_FRAMES;
    const nextStatus = isLoss ? 'LOST' : 'PLAYING';

    setGuesses(newGuesses);
    setGameStatus(nextStatus);

    if (!isLoss) {
      setViewedFrameIndex(newGuesses.length);
      playNodeConnect();
    }

    const storageKey = `reelquest_framesleuth_${activeDate}`;
    const finalDuration = Math.max(1, timerSeconds);
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: activeDate,
        guesses: newGuesses,
        status: nextStatus,
        gaveUp: false,
        timerSeconds: finalDuration,
        updatedAt: new Date().toISOString()
      })
    );

    if (isLoss) {
      playDefeat();
      setShowResultModal(true);
      saveDetailedMatch(user?.id, {
        id: `framesleuth_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'frame-sleuth',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: false,
        forfeited: false,
        hops: MAX_FRAMES,
        optimalHops: 1,
        framesUsed: MAX_FRAMES,
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        },
        guesses: newGuesses.map(g => g.skipped ? 'Skipped' : g.title)
      });
    }
  };

  const handleGiveUp = () => {
    if (gameStatus !== 'PLAYING') return;
    playDefeat();
    setGaveUp(true);
    setGameStatus('LOST');
    setShowResultModal(true);

    const storageKey = `reelquest_framesleuth_${activeDate}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: activeDate,
        guesses,
        status: 'LOST',
        gaveUp: true,
        updatedAt: new Date().toISOString()
      })
    );

    saveDetailedMatch(user?.id, {
      id: `framesleuth_${activeDate}_${user?.id || 'guest'}`,
      gameMode: 'frame-sleuth',
      subMode: isToday ? 'daily' : 'archive',
      date: activeDate,
      won: false,
      forfeited: true,
      hops: MAX_FRAMES,
      optimalHops: 1,
      framesUsed: MAX_FRAMES,
      targetMovie: {
        id: targetMovie.id,
        title: targetMovie.title,
        year: targetMovie.year,
        director: targetMovie.director,
        posterPath: targetMovie.posterPath
      },
      guesses: guesses.map(g => g.skipped ? 'Skipped' : g.title)
    });
  };

  const handleKeyDown = (e) => {
    if (!dropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        handleGuessMovie(suggestions[0]);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
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
    const lines = [];
    lines.push(`ReelQuest Frame Sleuth #${activeDate} 🎬`);
    if (gameStatus === 'WON') {
      lines.push(`👁️ Solved on Frame ${guesses.length}/${MAX_FRAMES}!`);
    } else {
      lines.push(`❌ Unsolved (${MAX_FRAMES}/${MAX_FRAMES})`);
    }
    lines.push('');

    let blocks = '';
    for (let i = 0; i < MAX_FRAMES; i++) {
      if (i < guesses.length) {
        const g = guesses[i];
        if (g.won) blocks += '🟩';
        else if (g.skipped) blocks += '⬛';
        else blocks += '🟥';
      } else {
        blocks += '⬛';
      }
    }
    lines.push(blocks);
    lines.push('');
    lines.push('Play: https://reelquest.io');

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const currentFramePath = targetMovie?.frames?.[viewedFrameIndex] || '';

  const canUnlockDecadeGenres = isPro || gameStatus !== 'PLAYING' || guesses.length >= 2;
  const canUnlockDirector = isPro || gameStatus !== 'PLAYING' || guesses.length >= 4;
  const formattedTimer = `${String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:${String(timerSeconds % 60).padStart(2, '0')}`;

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

      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-black shadow-2xl group">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/35 z-10" />

        {currentFramePath ? (
          <img
            src={getFrameImageUrl(currentFramePath, 'w1280')}
            alt={`Frame ${viewedFrameIndex + 1} of mystery movie`}
            onLoad={() => setImageLoading(false)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cinema-muted">
            <Camera className="h-12 w-12 opacity-30" />
          </div>
        )}

        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cinema-card/80 animate-pulse z-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-gold">
              <Camera className="h-4 w-4 animate-spin" />
              <span>Loading Frame {viewedFrameIndex + 1}...</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
          <span className="rounded-lg border border-white/15 bg-black/70 px-2.5 py-1 text-[11px] font-bold text-slate-100 backdrop-blur-md">
            Frame {viewedFrameIndex + 1} of {MAX_FRAMES}
          </span>

          <button
            type="button"
            onClick={() => {
              playClick();
              setShowZoomModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-gold/50 hover:text-gold backdrop-blur-md transition"
            title="Inspect frame in full resolution"
          >
            <ZoomIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Zoom</span>
          </button>
        </div>

        <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-3">
          {Array.from({ length: MAX_FRAMES }).map((_, idx) => {
            const isUnlocked = idx < unlockedFramesCount;
            const isCurrent = idx === viewedFrameIndex;
            const guessResult = guesses[idx];

            return (
              <button
                type="button"
                key={idx}
                onClick={() => {
                  if (isUnlocked) {
                    playClick();
                    setViewedFrameIndex(idx);
                  }
                }}
                disabled={!isUnlocked}
                className={`flex h-7 w-9 items-center justify-center rounded-lg text-xs font-extrabold backdrop-blur-md border transition ${
                  isCurrent
                    ? 'border-gold bg-gold text-cinema-black'
                    : guessResult?.won
                      ? 'border-emerald-400/60 bg-emerald-500/30 text-emerald-200'
                      : guessResult && !guessResult.skipped
                        ? 'border-rose-400/50 bg-rose-500/25 text-rose-200'
                        : isUnlocked
                          ? 'border-white/20 bg-black/70 text-slate-200 hover:border-white/40 hover:text-white'
                          : 'border-white/10 bg-black/45 text-slate-500 opacity-55 cursor-not-allowed'
                }`}
                title={isUnlocked ? `View Frame ${idx + 1}` : `Frame ${idx + 1} locked`}
              >
                {idx + 1}
              </button>
            );
          })}
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
                  onKeyDown={handleKeyDown}
                  placeholder={`Guess the film (Attempt ${guesses.length + 1} of ${MAX_FRAMES})...`}
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
                          <span className="text-xs sm:text-sm font-semibold block truncate text-white">
                            {movie.title}
                          </span>
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
                onClick={handleSkipFrame}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.1] bg-cinema-surface hover:border-white/25 hover:text-white text-slate-200 px-3.5 py-2.5 text-xs font-semibold transition active:scale-95"
                title="Skip to next frame without guessing"
              >
                <SkipForward className="h-3.5 w-3.5 text-gold" />
                <span>Skip</span>
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
                canUnlockDecadeGenres
                  ? 'border-gold/30 bg-gold/[0.07] text-slate-100'
                  : 'border-white/[0.07] bg-cinema-surface/60 text-cinema-muted'
              }`}>
                {canUnlockDecadeGenres ? (
                  <>
                    <Sparkles className="h-3 w-3 text-gold shrink-0" />
                    <span className="font-semibold">
                      {Math.floor(targetMovie.year / 10) * 10}s • {(targetMovie.genres || []).join(', ')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                    <span>Era &amp; Genre at Frame 3</span>
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
                    <span>Director at Frame 5</span>
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
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  {gameStatus === 'WON'
                    ? `Solved on Frame ${guesses.length} of ${MAX_FRAMES}`
                    : gaveUp
                      ? 'Film Revealed'
                      : 'Out of Frames'}
                </h3>
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
            currentMode="frame-sleuth"
            onSelectGame={onSelectGame}
            onOpenLeaderboard={onOpenLeaderboard}
          />
        </div>
      )}

      {showZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white transition"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>

            <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl">
              <img
                src={getFrameImageUrl(currentFramePath, 'original')}
                alt={`Full resolution frame ${viewedFrameIndex + 1}`}
                className="max-h-[82vh] w-full object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full text-xs text-cinema-muted">
              <span className="font-semibold text-gold">
                Frame #{viewedFrameIndex + 1} of {MAX_FRAMES}
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: unlockedFramesCount }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setViewedFrameIndex(idx)}
                    className={`h-7 w-7 rounded-lg font-mono text-xs font-bold transition ${
                      idx === viewedFrameIndex
                        ? 'bg-gold text-cinema-black'
                        : 'bg-cinema-card border border-white/10 text-cinema-muted hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                      ? `Solved on Frame ${guesses.length}/${MAX_FRAMES}`
                      : gaveUp
                        ? 'Secret Film Revealed'
                        : 'Out of Frames'}
                  </h3>
                  <span className="text-xs text-cinema-muted">
                    Frame Sleuth • {activeDate}
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

            {targetMovie.overview && (
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {targetMovie.overview}
              </p>
            )}

            <NextDailyGameBar
              currentMode="frame-sleuth"
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
                <Camera className="h-4 w-4 text-gold" />
                <h3 className="text-sm font-extrabold text-white">How to Play Frame Sleuth</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg text-cinema-muted hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p><strong className="text-white">Goal:</strong> Guess the secret daily movie in 6 frames or fewer.</p>
              <p><strong className="text-white">Progressive Frames:</strong> Frame 1 is the hardest ambient shot; Frame 6 reveals the most iconic scene.</p>
              <p><strong className="text-white">Clues:</strong> Frame 3 unlocks Era &amp; Genre. Frame 5 unlocks the Director.</p>
              <p><strong className="text-white">Zoom:</strong> Click Zoom in the top-right corner of the frame to inspect full-res details.</p>
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

      <FrameSleuthArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => {
          setActiveDate(newDate);
        }}
        isPro={isPro}
        onOpenPro={onOpenPro}
      />
    </div>
  );
}
