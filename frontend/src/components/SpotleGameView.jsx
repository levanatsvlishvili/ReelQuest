import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  Calendar,
  History,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Share2,
  Clock,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  User,
  Star,
  Info,
  Flag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SPOTLE_MOVIES, getSpotleMovieForDate, compareSpotleMovies } from '../data/spotleMovies';
import { saveDetailedMatch } from '../api/matchHistory';
import { recordLeaderboardScore } from '../api/leaderboardService';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { SpotleArchiveModal } from './SpotleArchiveModal';
import {
  playClick,
  playNodeConnect,
  playVictory,
  playDefeat,
  playHintWhisper
} from '../utils/soundEffects';

const MAX_GUESSES = 10;

/**
 * Interactive Cast Member Chip with Hover Tooltip Popover
 */
function CastMemberChip({ actor, isMatch }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative w-full max-w-[96px]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
    >
      <span
        className={`flex items-center justify-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer transition select-none truncate w-full ${
          isMatch
            ? 'bg-black/50 text-emerald-300 border border-emerald-300/50 shadow-sm'
            : 'bg-black/25 text-slate-300 hover:text-white border border-white/5'
        }`}
      >
        <span className="truncate">{actor}</span>
      </span>

      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-30 min-w-[130px] max-w-[210px] rounded-xl border border-cinema-border/90 bg-cinema-black/95 p-2 shadow-2xl backdrop-blur-md text-center pointer-events-none animate-fade-in">
          <div className="text-[11px] font-black text-white truncate flex items-center justify-center gap-1">
            <User className="h-3 w-3 text-gold shrink-0" />
            <span>{actor}</span>
          </div>
          <div className="mt-1">
            {isMatch ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400 border border-emerald-500/30">
                <Check className="h-2.5 w-2.5" />
                Matched Star
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-cinema-surface px-1.5 py-0.5 text-[9px] font-medium text-cinema-muted border border-cinema-border">
                Different Cast
              </span>
            )}
          </div>
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-cinema-black/95" />
        </div>
      )}
    </div>
  );
}

export function SpotleGameView({ onOpenPro, onOpenAuth }) {
  const { user } = useAuth();
  const isPro = Boolean(user?.isPro);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Active Date & Mystery Target
  const [activeDate, setActiveDate] = useState(todayStr);
  const [targetMovie, setTargetMovie] = useState(() => getSpotleMovieForDate(todayStr));
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Game state
  const [guesses, setGuesses] = useState([]);
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING' | 'WON' | 'LOST'
  const [gaveUp, setGaveUp] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [revealedClues, setRevealedClues] = useState({ tagline: false, cast: false });
  const [timerSeconds, setTimerSeconds] = useState(0);

  const searchInputRef = useRef(null);
  const timerRef = useRef(null);

  const isToday = activeDate === todayStr;

  // Load target movie and persistent local session when activeDate changes
  useEffect(() => {
    const movie = getSpotleMovieForDate(activeDate);
    setTargetMovie(movie);
    setSearchQuery('');
    setDropdownOpen(false);
    setShowResultModal(false);
    setCopiedShare(false);
    setGaveUp(false);
    setRevealedClues({ tagline: false, cast: false });
    setTimerSeconds(0);

    try {
      const raw = localStorage.getItem(`reelquest_spotle_${activeDate}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGuesses(parsed.guesses || []);
        setGameStatus(parsed.status || 'PLAYING');
        setGaveUp(Boolean(parsed.gaveUp));
        setTimerSeconds(parsed.timerSeconds || 0);
        if (parsed.status === 'WON' || parsed.status === 'LOST') {
          setShowResultModal(true);
        }
      } else {
        setGuesses([]);
        setGameStatus('PLAYING');
      }
    } catch (e) {
      setGuesses([]);
      setGameStatus('PLAYING');
    }
  }, [activeDate]);

  // Stopwatch timer for active gameplay
  useEffect(() => {
    if (gameStatus === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Filter movie suggestions based on user search query
  const suggestions = searchQuery.trim().length >= 1
    ? SPOTLE_MOVIES.filter((m) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          m.title.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q) ||
          String(m.year).includes(q)
        );
      }).slice(0, 8)
    : [];

  // Submit a movie guess
  const handleSelectMovieGuess = (movie) => {
    if (gameStatus !== 'PLAYING') return;

    if (guesses.some((g) => g.guessedMovie.id === movie.id || g.guessedMovie.title.toLowerCase() === movie.title.toLowerCase())) {
      setSearchQuery('');
      setDropdownOpen(false);
      return;
    }

    const compared = compareSpotleMovies(movie, targetMovie);
    const newGuesses = [...guesses, compared];
    const isWin = compared.isExactWin;
    const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;
    const nextStatus = isWin ? 'WON' : isLoss ? 'LOST' : 'PLAYING';

    setGuesses(newGuesses);
    setGameStatus(nextStatus);
    setSearchQuery('');
    setDropdownOpen(false);

    try {
      localStorage.setItem(
        `reelquest_spotle_${activeDate}`,
        JSON.stringify({
          date: activeDate,
          guesses: newGuesses,
          status: nextStatus,
          timerSeconds
        })
      );
    } catch (e) {}

    if (isWin) {
      playVictory();
      setShowResultModal(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      saveDetailedMatch(user?.id, {
        id: `spotle_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'spotle',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: true,
        hops: newGuesses.length,
        optimalHops: 1,
        durationSeconds: timerSeconds,
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        },
        guesses: newGuesses.map(g => g.guessedMovie.title)
      });
      if (user?.id) {
        recordLeaderboardScore('spotle', {
          userId: user.id,
          username: user.username,
          isPro: user.isPro,
          hops: newGuesses.length,
          score: Math.max(100, 1000 - newGuesses.length * 100),
          durationSeconds: timerSeconds,
          date: activeDate
        });
      }
    } else if (isLoss) {
      playDefeat();
      setShowResultModal(true);
      saveDetailedMatch(user?.id, {
        id: `spotle_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'spotle',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: false,
        hops: MAX_GUESSES,
        optimalHops: 1,
        durationSeconds: timerSeconds,
        targetMovie: {
          id: targetMovie.id,
          title: targetMovie.title,
          year: targetMovie.year,
          director: targetMovie.director,
          posterPath: targetMovie.posterPath
        },
        guesses: newGuesses.map(g => g.guessedMovie.title)
      });
    } else {
      playNodeConnect();
    }
  };

  // Give Up & Reveal Answer
  const handleGiveUp = () => {
    if (gameStatus !== 'PLAYING') return;

    setGameStatus('LOST');
    setGaveUp(true);
    setShowResultModal(true);
    playDefeat();

    try {
      localStorage.setItem(
        `reelquest_spotle_${activeDate}`,
        JSON.stringify({
          date: activeDate,
          guesses,
          status: 'LOST',
          gaveUp: true,
          timerSeconds
        })
      );
    } catch (e) {}

    saveDetailedMatch(user?.id, {
      id: `spotle_${activeDate}_${user?.id || 'guest'}`,
      gameMode: 'spotle',
      subMode: isToday ? 'daily' : 'archive',
      date: activeDate,
      won: false,
      hops: MAX_GUESSES,
      optimalHops: 1,
      durationSeconds: timerSeconds,
      targetMovie: {
        id: targetMovie.id,
        title: targetMovie.title,
        year: targetMovie.year,
        director: targetMovie.director,
        posterPath: targetMovie.posterPath
      },
      guesses: guesses.map(g => g.guessedMovie.title)
    });
  };

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e) => {
    if (!dropdownOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        handleSelectMovieGuess(suggestions[0]);
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
        handleSelectMovieGuess(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  // Date shifting (Yesterday / Tomorrow)
  const shiftDay = (days) => {
    playClick();
    const [y, m, d] = activeDate.split('-').map(Number);
    const dateUtc = new Date(Date.UTC(y, m - 1, d + days));
    const nextStr = dateUtc.toISOString().slice(0, 10);
    if (nextStr > todayStr) return;
    setActiveDate(nextStr);
  };

  // Generate shareable spoiler-free emoji grid (Wordle/Spotle style)
  const generateShareText = () => {
    const lines = [];
    lines.push(`ReelQuest Spotle #${activeDate} 🎬`);
    lines.push(gameStatus === 'WON' ? `Solved in ${guesses.length}/${MAX_GUESSES} guesses!` : `Unsolved (${MAX_GUESSES}/${MAX_GUESSES})`);
    lines.push('');

    guesses.forEach((g) => {
      const a = g.attributes;
      const yBox = a.year.status === 'EXACT' ? '🟩' : a.year.status === 'CLOSE' ? '🟨' : '⬛';
      const dBox = a.director.status === 'EXACT' ? '🟩' : '⬛';
      const gBox = a.genres.status === 'EXACT' ? '🟩' : a.genres.status === 'PARTIAL' ? '🟨' : '⬛';
      const cBox = a.cast.status === 'EXACT' ? '🟩' : a.cast.status === 'PARTIAL' ? '🟨' : '⬛';
      const sBox = a.rating.status === 'EXACT' ? '🟩' : a.rating.status === 'CLOSE' ? '🟨' : '⬛';
      const rBox = a.runtime.status === 'EXACT' ? '🟩' : a.runtime.status === 'CLOSE' ? '🟨' : '⬛';
      lines.push(`${yBox}${dBox}${gBox}${cBox}${sBox}${rBox}`);
    });

    lines.push('');
    lines.push('Play daily cinema mysteries at https://reelquest.io');
    return lines.join('\n');
  };

  const handleShare = () => {
    playClick();
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Clue unlocks
  const canUnlockTagline = isPro || guesses.length >= 3;
  const canUnlockCast = isPro || guesses.length >= 6;

  const handleUnlockClue = (type) => {
    playHintWhisper();
    setRevealedClues((prev) => ({ ...prev, [type]: true }));
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ===================================================================== */}
      {/* 1. COMPACT HEADER & DATE NAVIGATOR                                    */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/90 p-3 sm:p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mode Tag */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-amber-600 text-cinema-black shadow-gold-glow">
            <Film className="h-5 w-5 fill-cinema-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white">
                Spotle <span className="text-gold">Cinema</span>
              </h1>
              <span className="rounded-full bg-gold/15 px-2 py-0.2 text-[9px] font-extrabold uppercase text-gold border border-gold/30">
                DAILY PUZZLE
              </span>
            </div>
            <p className="text-[11px] text-cinema-muted">
              Guess the secret film in 10 tries using attribute clue tiles.
            </p>
          </div>
        </div>

        {/* Date Controls & Legend Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => shiftDay(-1)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-white transition active:scale-95"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5 rounded-lg border border-cinema-border bg-cinema-black/70 px-2.5 py-1 text-xs">
            <Calendar className="h-3 w-3 text-gold shrink-0" />
            <span className="font-extrabold text-white text-[11px]">
              {new Date(activeDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {isToday && (
              <span className="text-[8px] font-bold uppercase text-emerald-400">
                • Live
              </span>
            )}
          </div>

          <button
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {!isToday && (
            <button
              onClick={() => {
                playClick();
                setActiveDate(todayStr);
              }}
              className="flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition active:scale-95"
              title="Return to Today"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline text-[11px]">Today</span>
            </button>
          )}

          <button
            onClick={() => {
              playClick();
              setIsArchiveModalOpen(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-gold/50 hover:text-gold transition active:scale-95"
            title="Archive Calendar"
          >
            <History className="h-3 w-3" />
            <span className="hidden sm:inline text-[11px]">Archive</span>
          </button>

          <button
            onClick={() => setShowLegend((prev) => !prev)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-cinema-border bg-cinema-surface text-slate-300 hover:text-gold transition"
            title="How to Play / Clue Legend"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CLUE LEGEND MODAL / POPDOWN (HOW TO PLAY)                             */}
      {/* ===================================================================== */}
      {showLegend && (
        <div className="rounded-xl border border-gold/30 bg-cinema-card/95 p-3.5 text-xs text-slate-300 shadow-xl space-y-2 animate-fade-in">
          <div className="flex items-center justify-between border-b border-cinema-border/50 pb-2">
            <span className="font-black text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Spotle Tile Guide
            </span>
            <button onClick={() => setShowLegend(false)} className="text-cinema-muted hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-emerald-600 font-black text-white flex items-center justify-center text-[10px]">🟩</span>
              <span><strong>Green:</strong> Exact match for this attribute</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-amber-600 font-black text-white flex items-center justify-center text-[10px]">🟨</span>
              <span><strong>Yellow:</strong> Close (Year within 3y, partial cast/genre)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-[#212534] font-black text-slate-300 flex items-center justify-center text-[10px]">⬛</span>
              <span><strong>Dark:</strong> No match</span>
            </div>
          </div>
          <p className="text-[10px] text-cinema-muted pt-1 border-t border-cinema-border/40">
            Arrows (<strong>↑ Newer / Higher</strong> or <strong>↓ Older / Lower</strong>) guide your release year, score, and runtime.
          </p>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. SEARCH & CONTROLS BAR (Search, Attempt Counter & Give Up)          */}
      {/* ===================================================================== */}
      {gameStatus === 'PLAYING' && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input Bar */}
            <div className="relative z-20 flex-1 min-w-0">
              <div className="relative rounded-2xl border-2 border-gold/50 bg-cinema-card/95 p-1.5 sm:p-2 shadow-gold-glow/20 focus-within:border-gold focus-within:shadow-gold-glow transition flex items-center gap-2">
                <div className="flex items-center gap-2.5 px-3 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-gold shrink-0" />
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
                    placeholder={`Type a movie title (Guess ${guesses.length + 1} of ${MAX_GUESSES})...`}
                    className="w-full bg-transparent py-2 text-sm sm:text-base font-semibold text-white placeholder-cinema-muted focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="rounded-lg p-1 text-cinema-muted hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (suggestions.length > 0) {
                      handleSelectMovieGuess(suggestions[selectedIndex] || suggestions[0]);
                    }
                  }}
                  disabled={suggestions.length === 0}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-4 sm:px-5 py-2 text-xs font-black uppercase text-cinema-black shadow-gold-glow/30 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
                >
                  <span>Guess</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {dropdownOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-gold/40 bg-cinema-card/95 backdrop-blur-xl shadow-2xl divide-y divide-cinema-border/50 animate-fade-in max-h-80 overflow-y-auto z-40">
                  {suggestions.map((movie, idx) => {
                    const isSelected = idx === selectedIndex;
                    const alreadyGuessed = guesses.some((g) => g.guessedMovie.id === movie.id);

                    return (
                      <div
                        key={movie.id}
                        onClick={() => !alreadyGuessed && handleSelectMovieGuess(movie)}
                        className={`flex items-center justify-between p-2.5 sm:p-3 transition cursor-pointer ${
                          alreadyGuessed
                            ? 'opacity-40 cursor-not-allowed bg-cinema-black/40'
                            : isSelected
                              ? 'bg-gold/15 text-gold'
                              : 'hover:bg-cinema-surface/80 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-11 w-8 shrink-0 overflow-hidden rounded-md border border-cinema-border bg-cinema-surface">
                            {movie.posterPath ? (
                              <img
                                src={getTmdbImageUrl(movie.posterPath)}
                                alt={movie.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[7px] text-cinema-muted">
                                FILM
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-extrabold truncate text-white">{movie.title}</h4>
                            <p className="text-[10px] sm:text-[11px] text-cinema-muted truncate">
                              {movie.year} • Dir. {movie.director} • {movie.genres.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {alreadyGuessed ? (
                            <span className="text-[9px] uppercase font-bold text-cinema-muted">Guessed</span>
                          ) : (
                            <span className="rounded-lg bg-gold/15 px-2 py-0.5 text-[9px] font-extrabold text-gold border border-gold/30">
                              Select
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attempt Counter Info Badge & Give Up Button */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/15 px-3.5 py-2.5 text-xs font-black text-gold shadow-sm">
                <Trophy className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>Attempt {guesses.length + 1} / {MAX_GUESSES}</span>
              </div>

              <button
                onClick={handleGiveUp}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 px-3.5 py-2.5 text-xs font-black transition active:scale-95 shadow-sm"
                title="Give up and reveal the secret movie"
              >
                <Flag className="h-3.5 w-3.5 text-rose-400" />
                <span>Give Up</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MYSTERY CLUES SECTION (Positioned Above the Grid)                  */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-cinema-border/80 bg-cinema-card/85 p-3.5 sm:p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gold fill-gold" />
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
              Mystery Clues
            </h3>
          </div>
          <span className="text-[10px] text-cinema-muted font-bold">
            {isPro ? '🌟 PRO: All Clues Unlocked' : 'Unlocks at Guess 3 & 6'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Clue 1: Tagline */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-2.5 sm:p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                Clue #1: Tagline
              </span>
              <span className="text-[9px] text-cinema-muted">Unlock: 3 Guesses</span>
            </div>

            {revealedClues.tagline ? (
              <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                „{targetMovie.tagline || targetMovie.overview.slice(0, 90) + '...'}“
              </p>
            ) : canUnlockTagline ? (
              <button
                onClick={() => handleUnlockClue('tagline')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold/15 py-1 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition"
              >
                <span>Reveal Movie Tagline</span>
              </button>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{3 - guesses.length} more guesses</strong>.
              </p>
            )}
          </div>

          {/* Clue 2: Star Actor */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/70 p-2.5 sm:p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Clue #2: Lead Co-Star
              </span>
              <span className="text-[9px] text-cinema-muted">Unlock: 6 Guesses</span>
            </div>

            {revealedClues.cast ? (
              <p className="text-xs text-slate-200 font-medium">
                Starring <strong className="text-white">{targetMovie.cast[0]}</strong> alongside <strong className="text-white">{targetMovie.cast[1]}</strong>
              </p>
            ) : canUnlockCast ? (
              <button
                onClick={() => handleUnlockClue('cast')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-500/15 py-1 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
              >
                <span>Reveal Lead Co-Star</span>
              </button>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{6 - guesses.length} more guesses</strong>.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. THE SPOTLE PUZZLE MATRIX (Chronological: Guesses added below)       */}
      {/* ===================================================================== */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-none perspective-1000">
        <div className="min-w-[760px] max-w-4xl mx-auto space-y-2">
          {/* Header Row: 7 Category Tiles */}
          <div className="grid grid-cols-7 gap-2 text-center select-none">
            {[
              { label: 'Movie', icon: Film },
              { label: 'Director', icon: User },
              { label: 'Year', icon: Calendar },
              { label: 'Genres', icon: Sparkles },
              { label: 'Top Cast', icon: Star },
              { label: 'Score', icon: Trophy },
              { label: 'Runtime', icon: Clock }
            ].map((col, cIdx) => (
              <div
                key={cIdx}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-cinema-border/70 bg-cinema-surface/90 py-2.5 px-1 shadow-sm text-cinema-muted"
              >
                <col.icon className="h-3 w-3 text-gold shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                  {col.label}
                </span>
              </div>
            ))}
          </div>

          {/* Submitted Guess Rows (Reverse-chronological: Newest guess on top, oldest below) */}
          {[...guesses]
            .map((g, idx) => ({ ...g, attemptNum: idx + 1, isLatest: idx === guesses.length - 1 }))
            .reverse()
            .map((g) => {
              const a = g.attributes;
              const { attemptNum, isLatest } = g;

              return (
                <div
                  key={g.guessedMovie.id || attemptNum}
                  className="grid grid-cols-7 gap-2 animate-fade-in"
                >
                {/* Tile 1: Movie Guess */}
                <div
                  className={`h-[88px] rounded-xl border p-1.5 flex items-center gap-2 transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    g.isExactWin
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : 'bg-cinema-card/95 border-cinema-border/80 text-white'
                  }`}
                  style={{ animationDelay: isLatest ? '0ms' : undefined }}
                >
                  <div className="h-16 w-11 shrink-0 overflow-hidden rounded border border-white/20 bg-black/40">
                    {g.guessedMovie.posterPath ? (
                      <img
                        src={getTmdbImageUrl(g.guessedMovie.posterPath)}
                        alt={g.guessedMovie.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Film className="h-full w-full p-1 text-cinema-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <span className="text-[9px] font-extrabold uppercase text-gold/90 block leading-none mb-1">
                      #{attemptNum}
                    </span>
                    <h4 className="text-xs font-black truncate leading-tight text-white">
                      {g.guessedMovie.title}
                    </h4>
                    <span className="text-[10px] text-slate-300 block truncate mt-0.5">
                      {g.guessedMovie.year}
                    </span>
                  </div>
                </div>

                {/* Tile 2: Director */}
                <div
                  className={`h-[88px] rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.director.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '100ms' : undefined }}
                >
                  <span className="text-xs font-black leading-snug line-clamp-2 px-1">
                    {a.director.value}
                  </span>
                  {a.director.status === 'EXACT' && (
                    <span className="mt-1 flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-200 bg-black/30 px-1.5 py-0.5 rounded-full">
                      <Check className="h-2.5 w-2.5" /> Match
                    </span>
                  )}
                </div>

                {/* Tile 3: Release Year */}
                <div
                  className={`h-[88px] rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.year.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : a.year.status === 'CLOSE'
                        ? 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/30'
                        : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '200ms' : undefined }}
                >
                  <span className="text-base font-black font-mono leading-tight">
                    {a.year.value}
                  </span>
                  <div className="flex items-center gap-1 mt-1 font-black text-xs">
                    {a.year.direction === 'HIGHER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowUp className="h-3 w-3 animate-bounce" /> Newer
                      </span>
                    )}
                    {a.year.direction === 'LOWER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowDown className="h-3 w-3 animate-bounce" /> Older
                      </span>
                    )}
                    {a.year.direction === 'EQUAL' && (
                      <span className="flex items-center gap-0.5 text-emerald-200 bg-black/30 px-2 py-0.5 rounded-full text-[10px]">
                        <Check className="h-3 w-3" /> Exact
                      </span>
                    )}
                  </div>
                </div>

                {/* Tile 4: Genres */}
                <div
                  className={`h-[88px] rounded-xl border p-1.5 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.genres.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : a.genres.status === 'PARTIAL'
                        ? 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/30'
                        : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '300ms' : undefined }}
                >
                  <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                    {a.genres.value.slice(0, 3).map((genre, gIdx) => {
                      const isMatch = (a.genres.matching || []).includes(genre);
                      return (
                        <span
                          key={gIdx}
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black truncate max-w-[85px] ${
                            isMatch
                              ? 'bg-black/50 text-emerald-300 border border-emerald-300/40 shadow-sm'
                              : 'bg-black/25 text-slate-300 border border-white/5'
                          }`}
                        >
                          {genre}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Tile 5: Top Cast (Fits cleanly inside rectangle with zero overflow!) */}
                <div
                  className={`h-[88px] rounded-xl border p-1.5 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.cast.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : a.cast.status === 'PARTIAL'
                        ? 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/30'
                        : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '400ms' : undefined }}
                >
                  <div className="flex flex-col items-center justify-center gap-1 w-full max-h-full">
                    {a.cast.value.slice(0, 3).map((actor, actIdx) => {
                      const isMatch = (a.cast.matching || []).includes(actor);
                      return (
                        <CastMemberChip
                          key={actIdx}
                          actor={actor}
                          isMatch={isMatch}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Tile 6: Rating / Score */}
                <div
                  className={`h-[88px] rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.rating.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : a.rating.status === 'CLOSE'
                        ? 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/30'
                        : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '500ms' : undefined }}
                >
                  <div className="flex items-center gap-1 text-base font-black font-mono leading-tight">
                    <Star className="h-3.5 w-3.5 text-gold fill-gold" />
                    <span>{a.rating.value}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 font-black text-xs">
                    {a.rating.direction === 'HIGHER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowUp className="h-3 w-3" /> Higher
                      </span>
                    )}
                    {a.rating.direction === 'LOWER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowDown className="h-3 w-3" /> Lower
                      </span>
                    )}
                    {a.rating.direction === 'EQUAL' && (
                      <span className="flex items-center gap-0.5 text-emerald-200 bg-black/30 px-2 py-0.5 rounded-full text-[10px]">
                        <Check className="h-3 w-3" /> Match
                      </span>
                    )}
                  </div>
                </div>

                {/* Tile 7: Runtime */}
                <div
                  className={`h-[88px] rounded-xl border p-2 flex flex-col items-center justify-center text-center transition-all shadow-md overflow-hidden ${
                    isLatest ? 'animate-tile-flip' : ''
                  } ${
                    a.runtime.status === 'EXACT'
                      ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-emerald-500/30'
                      : a.runtime.status === 'CLOSE'
                        ? 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/30'
                        : 'bg-[#212534] border-cinema-border/80 text-slate-200'
                  }`}
                  style={{ animationDelay: isLatest ? '600ms' : undefined }}
                >
                  <span className="text-base font-black font-mono leading-tight">
                    {a.runtime.value}
                  </span>
                  <div className="flex items-center gap-1 mt-1 font-black text-xs">
                    {a.runtime.direction === 'HIGHER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowUp className="h-3 w-3" /> Longer
                      </span>
                    )}
                    {a.runtime.direction === 'LOWER' && (
                      <span className="flex items-center gap-0.5 text-gold bg-black/35 px-2 py-0.5 rounded-full text-[10px]">
                        <ArrowDown className="h-3 w-3" /> Shorter
                      </span>
                    )}
                    {a.runtime.direction === 'EQUAL' && (
                      <span className="flex items-center gap-0.5 text-emerald-200 bg-black/30 px-2 py-0.5 rounded-full text-[10px]">
                        <Check className="h-3 w-3" /> Match
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* When no guesses made yet: clean inviting prompt row */}
          {guesses.length === 0 && (
            <div className="rounded-xl border border-dashed border-cinema-border/70 bg-cinema-card/40 p-8 text-center text-cinema-muted space-y-1">
              <p className="text-xs font-bold text-slate-300">
                Awaiting your opening guess. Enter any movie title above!
              </p>
              <p className="text-[11px] text-cinema-muted">
                Each guess will stack below with attribute clues (10 attempts remaining).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. POST-GAME VICTORY / DEFEAT MODAL                                   */}
      {/* ===================================================================== */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border-2 border-gold/60 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-black p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <button
              onClick={() => setShowResultModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-cinema-muted hover:bg-cinema-border hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cinematic Trophy / Reel Icon */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/25 via-amber-600/20 to-transparent border-2 border-gold/40 shadow-gold-glow/40 animate-fade-in">
              {gameStatus === 'WON' ? (
                <Trophy className="h-10 w-10 text-gold animate-bounce" />
              ) : (
                <Film className="h-10 w-10 text-cinema-muted" />
              )}
            </div>

            <div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 border ${
                gameStatus === 'WON'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}>
                {gameStatus === 'WON'
                  ? `🏆 SOLVED IN ${guesses.length}/${MAX_GUESSES} GUESSES!`
                  : gaveUp
                    ? '🏳️ GAVE UP • ANSWER REVEALED'
                    : '🎬 OUT OF GUESSES'}
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {targetMovie.title} ({targetMovie.year})
              </h2>
              <p className="text-xs text-cinema-muted mt-1">
                Directed by <strong className="text-gold">{targetMovie.director}</strong> • {targetMovie.runtime} min • Rating: {targetMovie.rating}/10
              </p>
            </div>

            {/* Target Movie Artwork & Brief */}
            <div className="flex items-center gap-3 text-left rounded-2xl border border-cinema-border/70 bg-cinema-black/60 p-3.5">
              <img
                src={getTmdbImageUrl(targetMovie.posterPath)}
                alt={targetMovie.title}
                className="h-20 w-14 rounded-lg object-cover border border-gold/40 shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-gold block">
                  {targetMovie.genres.join(' • ')}
                </span>
                <p className="text-xs text-slate-300 line-clamp-3 leading-snug">
                  {targetMovie.overview}
                </p>
              </div>
            </div>

            {/* Share & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleShare}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-xs sm:text-sm font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition active:scale-95"
              >
                {copiedShare ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedShare ? 'Results Copied!' : 'Share Spoiler-Free Grid'}</span>
              </button>

              <button
                onClick={() => {
                  playClick();
                  setIsArchiveModalOpen(true);
                  setShowResultModal(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 py-3 text-xs font-bold text-slate-200 hover:border-gold/50 hover:text-gold transition"
              >
                <History className="h-4 w-4" />
                <span>Play Previous Day</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      <SpotleArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        currentDate={activeDate}
        onSelectDate={(newDate) => setActiveDate(newDate)}
      />
    </div>
  );
}
