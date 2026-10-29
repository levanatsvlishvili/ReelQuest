import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Camera,
  Film,
  Search,
  Trophy,
  Calendar,
  Sparkles,
  Clock,
  Share2,
  RotateCcw,
  Check,
  X,
  ChevronRight,
  Flag,
  ZoomIn,
  SkipForward,
  Lock,
  Unlock,
  HelpCircle,
  Clapperboard,
  Eye,
  Flame,
  Info,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { saveDetailedMatch } from '../api/matchHistory';
import { recordLeaderboardScore } from '../api/leaderboardService';
import {
  FRAME_SLEUTH_MOVIES,
  getFrameSleuthMovieForDate,
  getFrameImageUrl
} from '../data/frameSleuthMovies';
import { SPOTLE_MOVIES } from '../data/spotleMovies';
import { FrameSleuthArchiveModal } from './FrameSleuthArchiveModal';
import { DailyDateNavigator } from './DailyDateNavigator';
import {
  playClick,
  playNodeConnect,
  playVictory,
  playDefeat
} from '../utils/soundEffects';

const MAX_FRAMES = 6;

export function FrameSleuthGameView({ onOpenPro, onOpenAuth }) {
  const { user, isPro, isAuthenticated, stats } = useAuth();

  // Active puzzle date (defaults to today)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeDate, setActiveDate] = useState(todayStr);
  const isToday = activeDate === todayStr;

  // The secret mystery movie for this date
  const targetMovie = useMemo(() => {
    return getFrameSleuthMovieForDate(activeDate);
  }, [activeDate]);

  // Game state
  const [guesses, setGuesses] = useState([]); // [{ title, year, won, skipped }]
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING' | 'WON' | 'LOST'
  const [viewedFrameIndex, setViewedFrameIndex] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  // Search input & dropdown
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Modals
  const [showResultModal, setShowResultModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Search input ref
  const searchInputRef = useRef(null);

  // Current frame index available to the player based on attempts made
  // e.g. 0 guesses -> can access Frame 0.
  // 1 guess -> can access Frame 0 and Frame 1.
  const unlockedFramesCount = Math.min(MAX_FRAMES, guesses.length + 1);

  // Load progress for activeDate from localStorage
  useEffect(() => {
    try {
      const storageKey = `reelquest_framesleuth_${activeDate}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGuesses(parsed.guesses || []);
        setGameStatus(parsed.status || 'PLAYING');
        setGaveUp(Boolean(parsed.gaveUp));
        // View the latest unlocked frame or the last frame
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
        setViewedFrameIndex(0);
        setShowResultModal(false);
      }
    } catch (e) {
      setGuesses([]);
      setGameStatus('PLAYING');
      setGaveUp(false);
      setViewedFrameIndex(0);
      setShowResultModal(false);
    }
  }, [activeDate]);

  // Pre-load images for smooth transition
  useEffect(() => {
    setImageLoading(true);
  }, [viewedFrameIndex, activeDate]);

  // Autocomplete movie suggestions (from the rich 524-movie library)
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase().trim();

    return SPOTLE_MOVIES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.director && m.director.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery]);

  // Handle movie guess submission
  const handleGuessMovie = (movie) => {
    if (gameStatus !== 'PLAYING') return;

    // Check if already guessed
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

    // If game continues, advance to next frame
    if (!isWin && !isLoss) {
      setViewedFrameIndex(newGuesses.length);
      playNodeConnect();
    }

    // Persist to localStorage
    const storageKey = `reelquest_framesleuth_${activeDate}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: activeDate,
        guesses: newGuesses,
        status: nextStatus,
        gaveUp: false,
        updatedAt: new Date().toISOString()
      })
    );

    // Handle end-of-game
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
          durationSeconds: 30,
          date: activeDate
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

  // Skip Frame (advance to next frame without guessing)
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
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: activeDate,
        guesses: newGuesses,
        status: nextStatus,
        gaveUp: false,
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

  // Give Up & Reveal Answer
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

  // Keyboard navigation for search dropdown
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

  // Share score generator (Framed style emoji block)
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

    // Emoji blocks: 🟩 correct, 🟥 wrong, ⬛ skipped/remaining
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

  // Frame URL for current viewed frame
  const currentFramePath = targetMovie?.frames?.[viewedFrameIndex] || '';

  // Clue unlocks based on frames reached or PRO subscription
  const canUnlockDecadeGenres = isPro || guesses.length >= 2;
  const canUnlockDirector = isPro || guesses.length >= 4;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 animate-fade-in">
      {/* ===================================================================== */}
      {/* 1. HEADER SECTION (Game Mode Brand, Date Navigator & Control Buttons) */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/70 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/40 shadow-sm">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Frame Sleuth
                </h1>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-violet-300 border border-violet-500/40">
                  NEW
                </span>
                {isAuthenticated && (stats?.streak || 0) > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-black text-orange-400 border border-orange-500/30">
                    <Flame className="h-3 w-3 fill-orange-400" />
                    <span>{stats.streak}d Streak</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-cinema-muted">
                Deduce the secret cinema masterpiece from 6 progressive scene stills
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigator & Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <DailyDateNavigator
            currentDate={activeDate}
            onSelectDate={(newDate) => {
              playClick();
              setActiveDate(newDate);
            }}
          />

          <button
            onClick={() => {
              playClick();
              setShowArchiveModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border/80 bg-cinema-surface/80 px-3 py-2 text-xs font-bold text-slate-300 hover:border-violet-500/60 hover:text-white transition shadow-sm"
            title="Rewind to past challenges"
          >
            <Calendar className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          <button
            onClick={() => {
              playClick();
              setShowHowToPlay(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border/80 bg-cinema-surface/80 p-2 text-xs font-bold text-slate-300 hover:border-violet-500/60 hover:text-white transition shadow-sm"
            title="How to Play"
          >
            <HelpCircle className="h-4 w-4 text-violet-400" />
          </button>

          {gameStatus !== 'PLAYING' && (
            <button
              onClick={() => {
                playClick();
                setShowResultModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-violet-500/50 bg-violet-500/20 px-3 py-2 text-xs font-black text-violet-300 hover:bg-violet-500/30 transition shadow-sm"
            >
              <Trophy className="h-3.5 w-3.5 text-gold" />
              <span>Result</span>
            </button>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. GUESS INPUT & SEARCH BAR (Positioned between dates and frames)     */}
      {/* ===================================================================== */}
      {gameStatus === 'PLAYING' ? (
        <div className="rounded-2xl border border-violet-500/40 bg-cinema-card/95 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-violet-300">
              Submit Movie Guess (Frame {guesses.length + 1} of {MAX_FRAMES})
            </span>
            <span className="text-[11px] text-cinema-muted">
              {MAX_FRAMES - guesses.length} attempts remaining
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 relative">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="relative flex items-center rounded-xl border border-cinema-border/80 bg-cinema-surface/90 px-3 transition focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20">
                <Search className="h-4 w-4 text-violet-400 shrink-0 mr-2.5" />
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
                  placeholder={`Type a movie title (e.g. Inception, The Matrix, Pulp Fiction)...`}
                  className="w-full bg-transparent py-2.5 text-sm sm:text-base font-semibold text-white placeholder-cinema-muted focus:outline-none"
                />
                {searchQuery && (
                  <button
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

              {/* Autocomplete Dropdown */}
              {dropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-72 overflow-y-auto rounded-2xl border border-cinema-border/90 bg-cinema-card/95 p-1.5 shadow-2xl backdrop-blur-lg">
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
                        className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                          isSelected
                            ? 'bg-violet-600/30 border border-violet-500/50 text-white'
                            : 'hover:bg-cinema-surface text-slate-200'
                        } ${alreadyGuessed ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-black/50 border border-cinema-border/50">
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
                            <span className="text-sm font-extrabold block truncate text-white">
                              {movie.title}
                            </span>
                            <span className="text-[11px] text-cinema-muted block truncate">
                              {movie.year} • Dir. {movie.director}
                            </span>
                          </div>
                        </div>

                        {alreadyGuessed ? (
                          <span className="text-[10px] uppercase font-bold text-cinema-muted">
                            Guessed
                          </span>
                        ) : (
                          <span className="rounded-lg bg-violet-500/20 px-2 py-0.5 text-[10px] font-black text-violet-300 border border-violet-500/40">
                            Guess
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Skip Frame Button */}
            <button
              onClick={handleSkipFrame}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-black transition active:scale-95 shadow-sm shrink-0"
              title="Skip to next frame without guessing"
            >
              <SkipForward className="h-3.5 w-3.5 text-violet-400" />
              <span>Skip Frame</span>
            </button>

            {/* Give Up Button */}
            <button
              onClick={handleGiveUp}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 px-3.5 py-2.5 text-xs font-black transition active:scale-95 shadow-sm shrink-0"
              title="Give up and reveal secret movie"
            >
              <Flag className="h-3.5 w-3.5 text-rose-400" />
              <span>Give Up</span>
            </button>
          </div>
        </div>
      ) : (
        /* Game Over Banner */
        <div
          className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ${
            gameStatus === 'WON'
              ? 'border-emerald-500/50 bg-emerald-500/15'
              : 'border-rose-500/50 bg-rose-500/15'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                gameStatus === 'WON'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {gameStatus === 'WON' ? (
                <Trophy className="h-6 w-6 text-gold" />
              ) : (
                <Film className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {gameStatus === 'WON'
                  ? `Solved on Frame ${guesses.length} of ${MAX_FRAMES}!`
                  : gaveUp
                    ? 'Conceded Defeat'
                    : 'Out of Frames!'}
              </h3>
              <p className="text-xs text-slate-300">
                Secret Film: <strong className="text-white font-extrabold">{targetMovie.title}</strong> ({targetMovie.year})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleShare}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-black text-white transition active:scale-95 shadow-lg shadow-violet-600/30"
            >
              <Share2 className="h-4 w-4" />
              <span>{copiedShare ? 'Copied to Clipboard!' : 'Share Result'}</span>
            </button>
            <button
              onClick={() => setShowResultModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface/80 hover:bg-cinema-surface px-4 py-2.5 text-xs font-bold text-white transition shadow-sm"
            >
              <span>View Film Card</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CINEMA WIDESCREEN FRAME VIEWER                                     */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        {/* Frame Navigator Tabs (1 to 6) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1">
            {Array.from({ length: MAX_FRAMES }).map((_, idx) => {
              const isUnlocked = idx < unlockedFramesCount;
              const isCurrent = idx === viewedFrameIndex;
              const guessResult = guesses[idx];

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isUnlocked) {
                      playClick();
                      setViewedFrameIndex(idx);
                    }
                  }}
                  disabled={!isUnlocked}
                  className={`group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                    isCurrent
                      ? 'border-2 border-violet-400 bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-105'
                      : isUnlocked
                        ? 'border border-cinema-border bg-cinema-card/90 text-slate-300 hover:border-violet-400/60 hover:text-white'
                        : 'border border-cinema-border/40 bg-cinema-surface/30 text-cinema-muted opacity-50 cursor-not-allowed'
                  }`}
                >
                  {guessResult?.won ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : guessResult?.skipped ? (
                    <SkipForward className="h-3 w-3 text-slate-400" />
                  ) : guessResult ? (
                    <X className="h-3 w-3 text-rose-400" />
                  ) : isUnlocked ? (
                    <Eye className="h-3 w-3 text-violet-400" />
                  ) : (
                    <Lock className="h-3 w-3 text-cinema-muted" />
                  )}
                  <span>Frame {idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Inspect / Zoom Button */}
          <button
            onClick={() => {
              playClick();
              setShowZoomModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border/70 bg-cinema-card/90 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-violet-400 transition shrink-0"
            title="Inspect frame in full resolution"
          >
            <Maximize2 className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden sm:inline">Inspect Frame</span>
          </button>
        </div>

        {/* Cinematic Aspect-Ratio Frame Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-cinema-border/80 bg-black shadow-2xl shadow-violet-950/20 group">
          {/* Film Grain & Vignette Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10" />

          {/* The High-Resolution Movie Frame */}
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

          {/* Shimmer loading placeholder */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-cinema-card/80 animate-pulse z-0">
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
                <Camera className="h-5 w-5 animate-spin" />
                <span>Developing Frame {viewedFrameIndex + 1}...</span>
              </div>
            </div>
          )}

          {/* Corner Frame Stamp */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-violet-300 border border-violet-500/30 backdrop-blur-md">
              Reel Still #{viewedFrameIndex + 1} of 6
            </span>
            {viewedFrameIndex === 0 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-300 border border-amber-500/30 backdrop-blur-md hidden sm:inline">
                Difficulty: Hardest (Ambience & Setting)
              </span>
            )}
            {viewedFrameIndex === 1 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-amber-200 border border-amber-400/30 backdrop-blur-md hidden sm:inline">
                Environment & World
              </span>
            )}
            {viewedFrameIndex === 2 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-sky-300 border border-sky-500/30 backdrop-blur-md hidden sm:inline">
                Scene & Objects
              </span>
            )}
            {viewedFrameIndex === 3 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-indigo-300 border border-indigo-500/30 backdrop-blur-md hidden sm:inline">
                Action & Supporting Context
              </span>
            )}
            {viewedFrameIndex === 4 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-300 border border-emerald-500/30 backdrop-blur-md hidden sm:inline">
                Recognizable Scene
              </span>
            )}
            {viewedFrameIndex === 5 && (
              <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-400 border border-emerald-500/40 backdrop-blur-md hidden sm:inline">
                Final Clue: Iconic Hero Shot
              </span>
            )}
          </div>

          {/* Zoom Overlay Click Trigger */}
          <button
            onClick={() => {
              playClick();
              setShowZoomModal(true);
            }}
            className="absolute top-3 right-3 z-20 rounded-xl bg-black/75 p-2 text-slate-300 hover:text-white border border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition shadow-lg"
            title="Inspect in Fullscreen"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. ATTEMPTS PROGRESS TRACK & CLUES                                    */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: MAX_FRAMES }).map((_, idx) => {
          const g = guesses[idx];
          const isCurrent = idx === guesses.length && gameStatus === 'PLAYING';

          return (
            <div
              key={idx}
              className={`rounded-xl border p-2 text-center transition ${
                g?.won
                  ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-emerald-500/20'
                  : g?.skipped
                    ? 'border-slate-600 bg-slate-800/40 text-slate-400'
                    : g
                      ? 'border-rose-500/60 bg-rose-500/20 text-rose-300 shadow-rose-500/20'
                      : isCurrent
                        ? 'border-violet-500/70 bg-violet-500/10 text-violet-300 ring-2 ring-violet-500/30'
                        : 'border-cinema-border/50 bg-cinema-card/40 text-cinema-muted'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className="text-[10px] font-black uppercase">
                  #{idx + 1}
                </span>
                {g?.won ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : g?.skipped ? (
                  <SkipForward className="h-3 w-3 text-slate-400" />
                ) : g ? (
                  <X className="h-3 w-3 text-rose-400" />
                ) : isCurrent ? (
                  <Camera className="h-3 w-3 text-violet-400 animate-pulse" />
                ) : (
                  <Lock className="h-3 w-3 text-cinema-muted" />
                )}
              </div>
              <span className="text-[11px] font-bold block truncate">
                {g?.won ? 'Solved!' : g?.skipped ? 'Skipped' : g ? g.title : isCurrent ? 'Your Turn' : 'Locked'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clues Card (Decade, Genres, Director unlocks) */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/85 p-3.5 sm:p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Investigation Clues
            </h3>
          </div>
          <span className="text-[10px] text-cinema-muted font-bold">
            {isPro ? '🌟 PRO: All Clues Unlocked' : 'Unlocks as frames advance'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Clue 1: Decade & Genres */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-2.5 sm:p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Clue #1: Era & Genres
              </span>
              <span className="text-[9px] text-cinema-muted">Frame 3+</span>
            </div>
            {canUnlockDecadeGenres ? (
              <p className="text-xs font-bold text-white">
                {Math.floor(targetMovie.year / 10) * 10}s • {(targetMovie.genres || []).join(', ')}
              </p>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{2 - guesses.length} more attempts</strong>.
              </p>
            )}
          </div>

          {/* Clue 2: Director */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-2.5 sm:p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Clue #2: Director
              </span>
              <span className="text-[9px] text-cinema-muted">Frame 5+</span>
            </div>
            {canUnlockDirector ? (
              <p className="text-xs font-bold text-white">
                Directed by <strong className="text-gold">{targetMovie.director}</strong>
              </p>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{4 - guesses.length} more attempts</strong>.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. GUESS HISTORY TABLE                                                */}
      {/* ===================================================================== */}
      {guesses.length > 0 && (
        <div className="rounded-2xl border border-cinema-border/70 bg-cinema-card/90 p-4 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-cinema-border/50 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Investigation Log ({guesses.length}/{MAX_FRAMES})
            </span>
            <span className="text-[10px] text-cinema-muted">
              Reverse-chronological
            </span>
          </div>

          <div className="space-y-2">
            {[...guesses]
              .map((g, idx) => ({ ...g, attemptNum: idx + 1 }))
              .reverse()
              .map((g) => (
                <div
                  key={g.attemptNum}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                    g.won
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : g.skipped
                        ? 'border-slate-700 bg-slate-800/40 text-slate-400'
                        : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-black/40 px-2 py-0.5 font-mono text-[10px] font-black border border-white/10">
                      Frame #{g.attemptNum}
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {g.skipped ? 'Skipped Frame' : g.title}
                    </span>
                    {g.year && (
                      <span className="text-xs text-cinema-muted">({g.year})</span>
                    )}
                  </div>

                  <div>
                    {g.won ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/40">
                        <Check className="h-3 w-3" />
                        CORRECT
                      </span>
                    ) : g.skipped ? (
                      <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        SKIPPED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-300 border border-rose-500/40">
                        <X className="h-3 w-3" />
                        INCORRECT
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. FULLSCREEN ZOOM MODAL (HIGH RESOLUTION INSPECTION)                 */}
      {/* ===================================================================== */}
      {showZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center">
            <button
              onClick={() => setShowZoomModal(false)}
              className="absolute -top-12 right-0 flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white transition"
            >
              <X className="h-4 w-4" />
              <span>Close Inspection</span>
            </button>

            <div className="w-full overflow-hidden rounded-3xl border border-violet-500/40 bg-black shadow-2xl">
              <img
                src={getFrameImageUrl(currentFramePath, 'original')}
                alt={`Full resolution frame ${viewedFrameIndex + 1}`}
                className="max-h-[82vh] w-full object-contain"
              />
            </div>

            <div className="mt-3 flex items-center justify-between w-full text-xs text-cinema-muted">
              <span className="font-bold text-violet-400">
                Frame #{viewedFrameIndex + 1} of 6 • 1080p Cinema Still
              </span>
              <div className="flex items-center gap-2">
                {Array.from({ length: unlockedFramesCount }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setViewedFrameIndex(idx)}
                    className={`h-7 w-7 rounded-lg font-mono text-xs font-black transition ${
                      idx === viewedFrameIndex
                        ? 'bg-violet-600 text-white'
                        : 'bg-cinema-card border border-cinema-border text-cinema-muted hover:text-white'
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

      {/* ===================================================================== */}
      {/* 7. RESULT / VICTORY / REVEAL MODAL                                    */}
      {/* ===================================================================== */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-violet-500/50 bg-cinema-card p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-cinema-border/70">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    gameStatus === 'WON'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {gameStatus === 'WON' ? (
                    <Trophy className="h-5 w-5 text-gold" />
                  ) : (
                    <Film className="h-5 w-5 text-rose-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {gameStatus === 'WON'
                      ? 'SPECTACULAR DEDUCTION!'
                      : gaveUp
                        ? 'SECRET FILM REVEALED'
                        : 'OUT OF FRAMES'}
                  </h3>
                  <span className="text-xs text-cinema-muted">
                    {gameStatus === 'WON'
                      ? `Solved in ${guesses.length} of ${MAX_FRAMES} frames!`
                      : 'Better luck in tomorrow’s mystery reel!'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="p-1.5 rounded-xl border border-cinema-border/60 bg-cinema-surface/60 text-cinema-muted hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Movie Poster & Metadata Card */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-cinema-border/80 bg-cinema-surface/70 p-3.5">
              <img
                src={getTmdbImageUrl(targetMovie.posterPath)}
                alt={targetMovie.title}
                className="h-28 w-20 rounded-xl object-cover border border-violet-500/40 shrink-0 shadow-md"
              />
              <div className="min-w-0 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-violet-400 tracking-wider">
                  Target Film
                </span>
                <h4 className="text-base font-black text-white leading-tight">
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
                      className="rounded-md bg-cinema-card px-1.5 py-0.5 text-[9px] font-bold text-slate-300 border border-cinema-border"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            {targetMovie.overview && (
              <div className="rounded-xl border border-cinema-border/50 bg-black/40 p-3 text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                <span className="text-[10px] font-bold uppercase text-cinema-muted block mb-0.5">
                  Synopsis
                </span>
                {targetMovie.overview}
              </div>
            )}

            {/* Cast Chips */}
            {targetMovie.cast && (
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-cinema-muted block">
                  Top Cast
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {targetMovie.cast.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      className="rounded-lg bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 text-[11px] font-semibold text-violet-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share and Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 py-3 text-xs font-black text-white transition active:scale-95 shadow-lg shadow-violet-600/30"
              >
                <Share2 className="h-4 w-4" />
                <span>{copiedShare ? 'Copied to Clipboard! 📋' : 'Share Result to Friends'}</span>
              </button>

              <button
                onClick={() => {
                  setShowResultModal(false);
                  setShowArchiveModal(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-cinema-border/80 bg-cinema-surface py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                <Calendar className="h-3.5 w-3.5 text-violet-400" />
                <span>Play Previous Archive Days</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. HOW TO PLAY MODAL                                                  */}
      {/* ===================================================================== */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-violet-500/40 bg-cinema-card p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-border/70">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-black text-white">How to Play Frame Sleuth</h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg text-cinema-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                🎬 <strong>Goal:</strong> Guess the secret daily movie in 6 frames or fewer.
              </p>
              <p>
                🖼️ <strong>Progressive Clues:</strong> Each incorrect guess or skip unlocks a new frame from the film. Frame 1 is ambient and tricky; Frame 6 reveals the most iconic shot.
              </p>
              <p>
                🔍 <strong>Inspect Frame:</strong> Tap the "Inspect Frame" button to zoom in and examine background details in high resolution.
              </p>
              <p>
                💡 <strong>Clues:</strong> Reaching Frame 3 reveals the decade and genres. Frame 5 reveals the director.
              </p>
              <p>
                📅 <strong>Daily Puzzle:</strong> A brand new movie drops every midnight worldwide!
              </p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 py-2.5 text-xs font-black text-white transition active:scale-95"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* Archive Modal */}
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
