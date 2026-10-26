import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Search,
  Calendar,
  History,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Share2,
  Clock,
  HelpCircle,
  Lightbulb,
  Crown,
  ChevronLeft,
  ChevronRight,
  User,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SPOTLE_MOVIES, getSpotleMovieForDate, compareSpotleMovies } from '../data/spotleMovies';
import { saveDetailedMatch } from '../api/matchHistory';
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
 * Interactive Cast Member Chip with Hover/Click Tooltip Popover
 * Displays full actor name and unambiguous matched vs non-matched star badge
 */
function CastMemberChip({ actor, isMatch }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((prev) => !prev)}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold cursor-pointer transition select-none ${
          isMatch
            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
            : 'bg-cinema-surface/70 text-slate-300 border border-cinema-border/60 hover:text-white hover:border-cinema-muted'
        }`}
      >
        <span className="truncate max-w-[85px] sm:max-w-[105px]">{actor}</span>
      </span>

      {/* Floating Tooltip / Popover on hover or click */}
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

  // Search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Game state
  const [guesses, setGuesses] = useState([]); // array of compared results
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING' | 'WON' | 'LOST'
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
    setRevealedClues({ tagline: false, cast: false });
    setTimerSeconds(0);

    // Restore saved session for this date
    try {
      const raw = localStorage.getItem(`reelquest_spotle_${activeDate}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setGuesses(parsed.guesses || []);
        setGameStatus(parsed.status || 'PLAYING');
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

    // Check if already guessed
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

    // Save session state to localStorage
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
      // Save to detailed match history
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
      // Mid-game audio chime
      playNodeConnect();
    }
  };

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e) => {
    if (!dropdownOpen || suggestions.length === 0) return;
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

  // Cinema Vault Detective Dossier briefing
  const getDossierBriefing = () => {
    if (gameStatus === 'WON') {
      return `Masterful deduction! You identified "${targetMovie.title}" in ${guesses.length} guesses! A true cinematic scholar.`;
    }
    if (gameStatus === 'LOST') {
      return `The mystery reel has concluded! Today's secret film was "${targetMovie.title}" (${targetMovie.year}) directed by ${targetMovie.director}. Better luck tomorrow!`;
    }
    if (guesses.length === 0) {
      return `Today's mystery masterpiece is locked in the Cinema Vault. You have 10 attempts to deduce it. Enter your opening guess!`;
    }
    const lastGuess = guesses[guesses.length - 1];
    const attrs = lastGuess?.attributes;
    if (attrs?.director?.status === 'EXACT') {
      return `Directorial Match! You found the filmmaker (${attrs.director.value}) behind today's mystery title!`;
    }
    if (attrs?.cast?.status === 'EXACT' || attrs?.cast?.status === 'PARTIAL') {
      return `Star Cast Match! One or more actors from "${lastGuess.guessedMovie.title}" star in today's mystery title!`;
    }
    if (attrs?.year?.status === 'EXACT') {
      return `Release Year Locked! The film came out in ${attrs.year.value}. Now narrow down director and genres.`;
    }
    return `Guess ${guesses.length} of ${MAX_GUESSES}. Study the yellow and green tiles to close in on the secret movie.`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & DAY NAVIGATOR ("დღეების გადახვევა")                      */}
      {/* ===================================================================== */}
      <div className="rounded-3xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-4 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Game Title & Badges */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-amber-600 text-cinema-black shadow-gold-glow">
              <Film className="h-6 w-6 fill-cinema-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Spotle <span className="text-gold">Cinema</span>
                </h1>
                <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-gold border border-gold/40">
                  DAILY MYSTERY
                </span>
                {isToday && (
                  <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                    TODAY
                  </span>
                )}
              </div>
              <p className="text-xs text-cinema-muted">
                Deduce the secret daily film using attribute comparison tiles in 10 guesses.
              </p>
            </div>
          </div>

          {/* Date Rewind / Day Navigator Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => shiftDay(-1)}
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-white transition active:scale-95 shadow-sm"
              title="Previous Day's Mystery Movie"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-black/70 px-3.5 py-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-gold shrink-0" />
              <span className="font-extrabold text-white">
                {new Date(activeDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {isToday && (
                <span className="text-[9px] font-bold uppercase text-emerald-400 ml-1">
                  • Live
                </span>
              )}
            </div>

            <button
              onClick={() => shiftDay(1)}
              disabled={isToday}
              className="flex items-center justify-center h-9 w-9 rounded-xl border border-cinema-border bg-cinema-surface text-slate-300 hover:border-gold/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 shadow-sm"
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
                className="flex items-center gap-1 rounded-xl border border-gold/40 bg-gold/15 px-3 py-2 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition active:scale-95 shadow-sm"
                title="Jump to Today's Daily Mystery"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Today</span>
              </button>
            )}

            <button
              onClick={() => {
                playClick();
                setIsArchiveModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-slate-200 hover:border-gold/50 hover:text-gold transition active:scale-95"
              title="Browse Past Spotle Challenges"
            >
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. CINEMA VAULT DOSSIER HUD                                           */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-4 sm:p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/25 via-amber-500/15 to-transparent border border-gold/40 text-gold shadow-gold-glow/20">
              <Sparkles className="h-5 w-5 text-gold" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Cinema Vault Briefing
                </span>
                <span className={`rounded-full px-2 py-0.2 text-[9px] font-extrabold uppercase border ${
                  gameStatus === 'WON'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : gameStatus === 'LOST'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-gold/15 text-gold border-gold/30'
                }`}>
                  {gameStatus === 'WON' ? 'SOLVED' : gameStatus === 'LOST' ? 'UNSOLVED' : 'IN PROGRESS'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
                {getDossierBriefing()}
              </p>
            </div>
          </div>

          {/* 10-Attempt Visual Indicator Dots */}
          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 bg-cinema-black/50 px-3 py-2 rounded-xl border border-cinema-border/60">
            <span className="text-[10px] font-bold text-cinema-muted mr-1">Tries:</span>
            {Array.from({ length: MAX_GUESSES }).map((_, dotIdx) => {
              const isUsed = dotIdx < guesses.length;
              const isWonDot = dotIdx === guesses.length - 1 && gameStatus === 'WON';
              const isCurrent = dotIdx === guesses.length && gameStatus === 'PLAYING';

              return (
                <div
                  key={dotIdx}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    isWonDot
                      ? 'bg-emerald-400 shadow-emerald-500/50 scale-125 ring-2 ring-emerald-400/50'
                      : isUsed
                        ? 'bg-gold/80 shadow-gold-glow/40'
                        : isCurrent
                          ? 'bg-white/40 ring-1 ring-gold/60 animate-pulse'
                          : 'bg-cinema-border/50'
                  }`}
                  title={`Attempt ${dotIdx + 1}`}
                />
              );
            })}
            <span className="text-xs font-black text-white ml-1.5 font-mono">
              {guesses.length}/{MAX_GUESSES}
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. AUTOCOMPLETE MOVIE SEARCH BAR                                      */}
      {/* ===================================================================== */}
      {gameStatus === 'PLAYING' && (
        <div className="relative z-20">
          <div className="relative rounded-2xl border-2 border-gold/50 bg-cinema-card/95 p-2 shadow-gold-glow/20 focus-within:border-gold focus-within:shadow-gold-glow transition">
            <div className="flex items-center gap-3 px-3">
              <Search className="h-5 w-5 text-gold shrink-0" />
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
                placeholder="Type any movie title (e.g. Inception, Gladiator, The Dark Knight)..."
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

            {/* Suggestions Dropdown */}
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl border border-gold/40 bg-cinema-card/95 backdrop-blur-xl shadow-2xl divide-y divide-cinema-border/50 animate-fade-in max-h-80 overflow-y-auto">
                {suggestions.map((movie, idx) => {
                  const isSelected = idx === selectedIndex;
                  const alreadyGuessed = guesses.some((g) => g.guessedMovie.id === movie.id);

                  return (
                    <div
                      key={movie.id}
                      onClick={() => !alreadyGuessed && handleSelectMovieGuess(movie)}
                      className={`flex items-center justify-between p-3 transition cursor-pointer ${
                        alreadyGuessed
                          ? 'opacity-40 cursor-not-allowed bg-cinema-black/40'
                          : isSelected
                            ? 'bg-gold/15 text-gold'
                            : 'hover:bg-cinema-surface/80 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-8 shrink-0 overflow-hidden rounded-md border border-cinema-border bg-cinema-surface">
                          {movie.posterPath ? (
                            <img
                              src={getTmdbImageUrl(movie.posterPath)}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-cinema-muted">
                              FILM
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-extrabold truncate">{movie.title}</h4>
                          <p className="text-[11px] text-cinema-muted truncate">
                            {movie.year} • Dir. {movie.director} • {movie.genres.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        {alreadyGuessed ? (
                          <span className="text-[10px] uppercase font-bold text-cinema-muted">Guessed</span>
                        ) : (
                          <span className="rounded-lg bg-gold/15 px-2.5 py-1 text-[10px] font-extrabold text-gold border border-gold/30">
                            Guess Movie
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. THE SPOTLE COMPARISON MATRIX                                       */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        {/* Table Column Headers */}
        <div className="hidden md:grid md:grid-cols-12 gap-2 px-3 text-[11px] font-black uppercase tracking-wider text-cinema-muted">
          <div className="col-span-3">Movie Guess</div>
          <div className="col-span-1 text-center">Year</div>
          <div className="col-span-2 text-center">Director</div>
          <div className="col-span-2 text-center">Genres</div>
          <div className="col-span-2 text-center">Top Cast</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-1 text-center">Runtime</div>
        </div>

        {/* Guesses List */}
        {guesses.map((g, idx) => {
          const a = g.attributes;
          return (
            <div
              key={idx}
              className={`rounded-2xl border p-3 md:p-2.5 transition-all shadow-lg animate-fade-in ${
                g.isExactWin
                  ? 'border-emerald-500 bg-gradient-to-r from-emerald-950/40 via-cinema-card to-emerald-950/40 shadow-emerald-500/20'
                  : 'border-cinema-border/80 bg-cinema-card/90'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                {/* 1. Movie Title & Poster */}
                <div className="col-span-12 md:col-span-3 flex items-center gap-2.5 min-w-0 pb-2 md:pb-0 border-b md:border-b-0 border-cinema-border/40">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cinema-surface border border-cinema-border text-[10px] font-black text-gold">
                    {idx + 1}
                  </span>
                  <div className="h-10 w-7 shrink-0 overflow-hidden rounded border border-cinema-border bg-cinema-surface">
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
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                      {g.guessedMovie.title}
                    </h3>
                    <span className="text-[10px] text-cinema-muted block">
                      {g.guessedMovie.year}
                    </span>
                  </div>
                </div>

                {/* 2. Release Year */}
                <div
                  className={`col-span-6 md:col-span-1 flex flex-col items-center justify-center rounded-xl p-2 text-center border font-bold text-xs ${
                    a.year.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : a.year.status === 'CLOSE'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Year</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>{a.year.value}</span>
                    {a.year.direction === 'HIGHER' && <ArrowUp className="h-3.5 w-3.5 text-gold shrink-0 animate-bounce" />}
                    {a.year.direction === 'LOWER' && <ArrowDown className="h-3.5 w-3.5 text-gold shrink-0 animate-bounce" />}
                    {a.year.direction === 'EQUAL' && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                  </div>
                </div>

                {/* 3. Director */}
                <div
                  className={`col-span-6 md:col-span-2 flex flex-col items-center justify-center rounded-xl p-2 text-center border text-xs font-bold ${
                    a.director.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Director</span>
                  <span className="truncate max-w-full">{a.director.value}</span>
                </div>

                {/* 4. Genres */}
                <div
                  className={`col-span-6 md:col-span-2 flex flex-col items-center justify-center rounded-xl p-2 text-center border text-xs font-bold ${
                    a.genres.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : a.genres.status === 'PARTIAL'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Genres</span>
                  <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                    {a.genres.value.slice(0, 3).map((genre, gIdx) => {
                      const isMatch = (a.genres.matching || []).includes(genre);
                      return (
                        <span
                          key={gIdx}
                          className={`rounded px-1.5 py-0.2 text-[10px] font-extrabold ${
                            isMatch ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-300'
                          }`}
                        >
                          {genre}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Top Cast */}
                <div
                  className={`col-span-6 md:col-span-2 flex flex-col items-center justify-center rounded-xl p-2 text-center border text-xs font-bold ${
                    a.cast.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : a.cast.status === 'PARTIAL'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Cast</span>
                  <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                    {a.cast.value.map((actor, actIdx) => {
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

                {/* 6. Score */}
                <div
                  className={`col-span-6 md:col-span-1 flex flex-col items-center justify-center rounded-xl p-2 text-center border font-bold text-xs ${
                    a.rating.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : a.rating.status === 'CLOSE'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Rating</span>
                  <div className="flex items-center gap-1 font-mono">
                    <Star className="h-3 w-3 text-gold fill-gold" />
                    <span>{a.rating.value}</span>
                    {a.rating.direction === 'HIGHER' && <ArrowUp className="h-3 w-3 text-gold shrink-0" />}
                    {a.rating.direction === 'LOWER' && <ArrowDown className="h-3 w-3 text-gold shrink-0" />}
                  </div>
                </div>

                {/* 7. Runtime */}
                <div
                  className={`col-span-6 md:col-span-1 flex flex-col items-center justify-center rounded-xl p-2 text-center border font-bold text-xs ${
                    a.runtime.status === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : a.runtime.status === 'CLOSE'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-cinema-surface/70 border-cinema-border text-slate-300'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider text-cinema-muted md:hidden">Runtime</span>
                  <div className="flex items-center gap-1 font-mono">
                    <span>{a.runtime.value}</span>
                    {a.runtime.direction === 'HIGHER' && <ArrowUp className="h-3 w-3 text-gold shrink-0" />}
                    {a.runtime.direction === 'LOWER' && <ArrowDown className="h-3 w-3 text-gold shrink-0" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty Placeholder Rows for Remaining Attempts */}
        {Array.from({ length: Math.max(0, MAX_GUESSES - guesses.length) }).map((_, pIdx) => {
          const rowNum = guesses.length + pIdx + 1;
          const isNextActive = pIdx === 0 && gameStatus === 'PLAYING';

          return (
            <div
              key={`placeholder-${pIdx}`}
              className={`rounded-2xl border p-3 text-center transition ${
                isNextActive
                  ? 'border-gold/30 bg-cinema-card/40 border-dashed animate-pulse'
                  : 'border-cinema-border/30 bg-cinema-surface/20 opacity-40'
              }`}
            >
              <span className="text-xs font-bold text-cinema-muted">
                {isNextActive ? `Guess ${rowNum} of ${MAX_GUESSES} • Awaiting Movie Title...` : `Attempt #${rowNum}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 5. CINEMA VAULT CLUES (Interactive Dynamic Hints)                     */}
      {/* ===================================================================== */}
      <div className="rounded-2xl border border-gold/30 bg-cinema-card/90 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-gold fill-gold" />
            <h3 className="text-sm font-extrabold text-white">Cinema Vault Clues</h3>
          </div>
          <span className="text-[11px] text-cinema-muted">
            {isPro ? '🌟 PRO: Unlimited Clues Unlocked' : 'Unlocks at Guess 3 & 6'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Clue 1: Tagline */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                Clue #1: Tagline &amp; Theme
              </span>
              <span className="text-[10px] text-cinema-muted">Unlock: 3 Guesses</span>
            </div>

            {revealedClues.tagline ? (
              <p className="text-xs text-slate-200 italic font-medium leading-relaxed">
                „{targetMovie.tagline || targetMovie.overview.slice(0, 90) + '...'}“
              </p>
            ) : canUnlockTagline ? (
              <button
                onClick={() => handleUnlockClue('tagline')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-gold/50 bg-gold/15 py-1.5 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition"
              >
                <span>Reveal Movie Tagline</span>
              </button>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{3 - guesses.length} more guesses</strong> to reveal clue.
              </p>
            )}
          </div>

          {/* Clue 2: Star Actor */}
          <div className="rounded-xl border border-cinema-border/70 bg-cinema-surface/60 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Clue #2: Lead Co-Star
              </span>
              <span className="text-[10px] text-cinema-muted">Unlock: 6 Guesses</span>
            </div>

            {revealedClues.cast ? (
              <p className="text-xs text-slate-200 font-medium">
                Starring <strong className="text-white">{targetMovie.cast[0]}</strong> alongside <strong className="text-white">{targetMovie.cast[1]}</strong>
              </p>
            ) : canUnlockCast ? (
              <button
                onClick={() => handleUnlockClue('cast')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-indigo-500/50 bg-indigo-500/15 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
              >
                <span>Reveal Lead Co-Star</span>
              </button>
            ) : (
              <p className="text-xs text-cinema-muted">
                Locked. Make <strong>{6 - guesses.length} more guesses</strong> to reveal clue.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. POST-GAME VICTORY / DEFEAT MODAL                                   */}
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
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-gold/25 via-amber-600/20 to-transparent border-2 border-gold/40 shadow-gold-glow/40 animate-fade-in">
              {gameStatus === 'WON' ? (
                <Trophy className="h-12 w-12 text-gold animate-bounce" />
              ) : (
                <Film className="h-12 w-12 text-cinema-muted" />
              )}
            </div>

            <div>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider mb-2 border ${
                gameStatus === 'WON'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}>
                {gameStatus === 'WON' ? `🏆 SOLVED IN ${guesses.length}/${MAX_GUESSES} GUESSES!` : '🎬 OUT OF GUESSES'}
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
