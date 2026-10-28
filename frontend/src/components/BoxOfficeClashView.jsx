import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp,
  Flame,
  Calendar,
  Sparkles,
  Trophy,
  ArrowUpCircle,
  ArrowDownCircle,
  Check,
  X,
  Share2,
  RotateCcw,
  Film,
  HelpCircle,
  Clock,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTmdbImageUrl } from '../api/client';
import { saveDetailedMatch } from '../api/matchHistory';
import {
  BOX_OFFICE_MOVIES,
  formatFullRevenue,
  formatShortRevenue,
  getDailyBoxOfficeMatchups,
  getRandomContender
} from '../data/boxOfficeMovies';
import { DailyDateNavigator } from './DailyDateNavigator';
import {
  playClick,
  playNodeConnect,
  playVictory,
  playDefeat
} from '../utils/soundEffects';

export function BoxOfficeClashView({ onOpenPro, onOpenAuth }) {
  const { user, isAuthenticated, stats } = useAuth();

  // Mode: 'endless' (Streak) or 'daily' (5-Round Challenge)
  const [subMode, setSubMode] = useState('endless');

  // Active date for Daily Mode
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [activeDate, setActiveDate] = useState(todayStr);
  const isToday = activeDate === todayStr;

  // =========================================================================
  // ENDLESS STREAK STATE
  // =========================================================================
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    try {
      return parseInt(localStorage.getItem('reelquest_bo_best_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [endlessMovieA, setEndlessMovieA] = useState(() => BOX_OFFICE_MOVIES[0]);
  const [endlessMovieB, setEndlessMovieB] = useState(() => BOX_OFFICE_MOVIES[1]);
  const [endlessRevealed, setEndlessRevealed] = useState(false);
  const [endlessLastResult, setEndlessLastResult] = useState(null); // 'CORRECT' | 'WRONG'
  const [endlessGameOver, setEndlessGameOver] = useState(false);
  const [endlessHistory, setEndlessHistory] = useState([]); // Array of previous matchups

  // =========================================================================
  // DAILY 5-ROUND STATE
  // =========================================================================
  const dailyMatchups = useMemo(() => {
    return getDailyBoxOfficeMatchups(activeDate);
  }, [activeDate]);

  const [dailyRound, setDailyRound] = useState(0); // 0 to 4 (5 rounds)
  const [dailyGuesses, setDailyGuesses] = useState([]); // [{ round, chosen: 'HIGHER'|'LOWER', correct: boolean, movieA, movieB }]
  const [dailyRevealed, setDailyRevealed] = useState(false);
  const [dailyComplete, setDailyComplete] = useState(false);

  // Modals & UI helpers
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [animatingNext, setAnimatingNext] = useState(false);

  // Load daily progress for activeDate
  useEffect(() => {
    if (subMode !== 'daily') return;
    try {
      const storageKey = `reelquest_bo_daily_${activeDate}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setDailyGuesses(parsed.guesses || []);
        setDailyComplete(Boolean(parsed.complete));
        setDailyRound(parsed.guesses ? Math.min(4, parsed.guesses.length) : 0);
        setDailyRevealed(false);
      } else {
        setDailyGuesses([]);
        setDailyComplete(false);
        setDailyRound(0);
        setDailyRevealed(false);
      }
    } catch {
      setDailyGuesses([]);
      setDailyComplete(false);
      setDailyRound(0);
      setDailyRevealed(false);
    }
  }, [activeDate, subMode]);

  // Reset Endless Streak
  const handleStartNewEndless = () => {
    playClick();
    const firstA = getRandomContender();
    const firstB = getRandomContender([firstA.id]);
    setEndlessMovieA(firstA);
    setEndlessMovieB(firstB);
    setCurrentStreak(0);
    setEndlessRevealed(false);
    setEndlessLastResult(null);
    setEndlessGameOver(false);
    setEndlessHistory([]);
  };

  // =========================================================================
  // ENDLESS GUESS HANDLER
  // =========================================================================
  const handleEndlessGuess = (choice) => {
    if (endlessRevealed || endlessGameOver) return;
    playClick();

    const revA = endlessMovieA.revenue;
    const revB = endlessMovieB.revenue;

    const isHigher = revB >= revA;
    const isCorrect = (choice === 'HIGHER' && isHigher) || (choice === 'LOWER' && !isHigher);

    setEndlessRevealed(true);
    setEndlessLastResult(isCorrect ? 'CORRECT' : 'WRONG');

    if (isCorrect) {
      playVictory();
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
        try {
          localStorage.setItem('reelquest_bo_best_streak', String(nextStreak));
        } catch {}
      }

      setEndlessHistory(prev => [
        ...prev,
        {
          movieA: endlessMovieA,
          movieB: endlessMovieB,
          choice,
          correct: true
        }
      ]);

      // Transition to next matchup after 1.4 seconds
      setTimeout(() => {
        setAnimatingNext(true);
        setTimeout(() => {
          setEndlessMovieA(endlessMovieB);
          const nextContender = getRandomContender([endlessMovieA.id, endlessMovieB.id]);
          setEndlessMovieB(nextContender);
          setEndlessRevealed(false);
          setEndlessLastResult(null);
          setAnimatingNext(false);
          playNodeConnect();
        }, 300);
      }, 1400);
    } else {
      playDefeat();
      setEndlessGameOver(true);

      // Save match record
      saveDetailedMatch(user?.id, {
        id: `bo_streak_${Date.now()}_${user?.id || 'guest'}`,
        gameMode: 'box-office',
        subMode: 'streak',
        date: todayStr,
        won: currentStreak >= 5,
        forfeited: false,
        hops: currentStreak, // Streak reached
        optimalHops: 10,
        boxOfficeScore: currentStreak,
        targetMovie: {
          id: endlessMovieB.id,
          title: `${endlessMovieA.title} vs ${endlessMovieB.title}`,
          year: endlessMovieB.year,
          director: endlessMovieB.director,
          posterPath: endlessMovieB.posterPath
        },
        guesses: [`Streak: ${currentStreak}`]
      });
    }
  };

  // =========================================================================
  // DAILY 5-ROUND GUESS HANDLER
  // =========================================================================
  const handleDailyGuess = (choice) => {
    if (dailyRevealed || dailyComplete) return;
    playClick();

    const currentMatchup = dailyMatchups[dailyRound];
    if (!currentMatchup) return;

    const revA = currentMatchup.movieA.revenue;
    const revB = currentMatchup.movieB.revenue;

    const isHigher = revB >= revA;
    const isCorrect = (choice === 'HIGHER' && isHigher) || (choice === 'LOWER' && !isHigher);

    if (isCorrect) playVictory();
    else playDefeat();

    setDailyRevealed(true);

    const newGuess = {
      round: dailyRound + 1,
      chosen: choice,
      correct: isCorrect,
      movieA: currentMatchup.movieA,
      movieB: currentMatchup.movieB
    };

    const updatedGuesses = [...dailyGuesses, newGuess];
    setDailyGuesses(updatedGuesses);

    const isFinished = updatedGuesses.length >= 5;
    if (isFinished) {
      setDailyComplete(true);
      const totalCorrect = updatedGuesses.filter(g => g.correct).length;

      // Save to localStorage
      try {
        const storageKey = `reelquest_bo_daily_${activeDate}`;
        localStorage.setItem(storageKey, JSON.stringify({
          date: activeDate,
          guesses: updatedGuesses,
          complete: true,
          score: totalCorrect,
          updatedAt: new Date().toISOString()
        }));
      } catch {}

      // Save match record
      saveDetailedMatch(user?.id, {
        id: `bo_daily_${activeDate}_${user?.id || 'guest'}`,
        gameMode: 'box-office',
        subMode: isToday ? 'daily' : 'archive',
        date: activeDate,
        won: totalCorrect >= 3,
        forfeited: false,
        hops: totalCorrect,
        optimalHops: 5,
        boxOfficeScore: totalCorrect,
        targetMovie: {
          id: currentMatchup.movieB.id,
          title: `Daily Box Office (${totalCorrect}/5)`,
          year: currentMatchup.movieB.year,
          director: currentMatchup.movieB.director,
          posterPath: currentMatchup.movieB.posterPath
        },
        guesses: updatedGuesses.map(g => `${g.movieA.title} vs ${g.movieB.title}: ${g.correct ? 'PASS' : 'FAIL'}`)
      });
    }
  };

  const handleNextDailyRound = () => {
    playClick();
    if (dailyRound < 4) {
      setDailyRound(prev => prev + 1);
      setDailyRevealed(false);
      playNodeConnect();
    }
  };

  // Share score generator
  const handleShare = () => {
    playClick();
    const lines = [];
    if (subMode === 'endless') {
      lines.push(`ReelQuest Box Office Clash 💰`);
      lines.push(`🔥 Endless Streak: ${currentStreak} Movies in a Row!`);
      lines.push(`Best: ${bestStreak}`);
    } else {
      const correctCount = dailyGuesses.filter(g => g.correct).length;
      lines.push(`ReelQuest Daily Box Office Clash #${activeDate} 💰`);
      lines.push(`🏆 Score: ${correctCount}/5 Correct!`);
      const blocks = dailyGuesses.map(g => g.correct ? '🟩' : '🟥').join('');
      lines.push(blocks);
    }
    lines.push('');
    lines.push('Play: https://reelquest.io');

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Helper for current Daily round matchup
  const activeDailyMatchup = dailyMatchups[dailyRound] || dailyMatchups[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 animate-fade-in">
      {/* ===================================================================== */}
      {/* 1. HEADER (Brand, Sub-Mode Switcher, Date / Streak Badges)           */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cinema-border/70 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Box Office Clash
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300 border border-emerald-500/40">
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
                Which film dominated the global box office? Guess Higher or Lower!
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Mode Switcher Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center rounded-xl border border-cinema-border bg-cinema-surface/90 p-1 shadow-sm">
            <button
              onClick={() => {
                playClick();
                setSubMode('endless');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                subMode === 'endless'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-cinema-muted hover:text-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Endless Streak</span>
            </button>
            <button
              onClick={() => {
                playClick();
                setSubMode('daily');
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                subMode === 'daily'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-cinema-muted hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Daily 5-Round</span>
            </button>
          </div>

          <button
            onClick={() => {
              playClick();
              setShowHowToPlay(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border/80 bg-cinema-surface/80 p-2 text-xs font-bold text-slate-300 hover:border-emerald-500/60 hover:text-white transition shadow-sm"
            title="How to Play"
          >
            <HelpCircle className="h-4 w-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SUB-MODE SUB-HEADER (Streak bar OR Daily round navigator)          */}
      {/* ===================================================================== */}
      {subMode === 'endless' ? (
        <div className="flex items-center justify-between rounded-2xl border border-cinema-border/70 bg-cinema-card/80 p-3 sm:p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-orange-500/15 border border-orange-500/30 px-3.5 py-2 text-orange-400">
              <Flame className="h-4 w-4 fill-orange-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Current Streak:</span>
              <span className="font-mono text-base font-black text-white">{currentStreak}</span>
            </div>
            <div className="text-xs text-cinema-muted hidden sm:block">
              Best Streak: <strong className="text-gold font-mono">{bestStreak}</strong>
            </div>
          </div>

          <button
            onClick={handleStartNewEndless}
            className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset / New Game</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-cinema-border/70 bg-cinema-card/80 p-3 sm:p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <DailyDateNavigator
              currentDate={activeDate}
              onSelectDate={(newDate) => {
                playClick();
                setActiveDate(newDate);
              }}
            />
            <span className="text-xs font-bold text-slate-300 hidden sm:inline">
              Daily Challenge #{activeDate}
            </span>
          </div>

          {/* 5-Round Progress Dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, idx) => {
              const guess = dailyGuesses[idx];
              const isCurrent = idx === dailyRound && !dailyComplete;

              return (
                <div
                  key={idx}
                  className={`flex h-8 items-center gap-1 rounded-xl px-2.5 text-xs font-black border transition ${
                    guess?.correct
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : guess && !guess.correct
                        ? 'border-rose-500 bg-rose-500/20 text-rose-300'
                        : isCurrent
                          ? 'border-gold bg-gold/20 text-gold ring-2 ring-gold/30'
                          : 'border-cinema-border/60 bg-cinema-surface/50 text-cinema-muted opacity-60'
                  }`}
                >
                  {guess?.correct ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : guess ? (
                    <X className="h-3 w-3 text-rose-400" />
                  ) : (
                    <span>R{idx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. THE VERSUS CLASH ARENA (Movie A vs Movie B)                        */}
      {/* ===================================================================== */}
      {(() => {
        const movieA = subMode === 'endless' ? endlessMovieA : activeDailyMatchup?.movieA;
        const movieB = subMode === 'endless' ? endlessMovieB : activeDailyMatchup?.movieB;
        const isRevealed = subMode === 'endless' ? endlessRevealed : dailyRevealed;
        const lastResult = subMode === 'endless'
          ? endlessLastResult
          : dailyGuesses[dailyRound]?.correct ? 'CORRECT' : dailyRevealed ? 'WRONG' : null;

        return (
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300">
            {/* VS Badge in the center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-cinema-card border-2 border-gold shadow-2xl text-gold font-black text-sm">
              VS
            </div>

            {/* CARD A (Left Movie - Known Revenue) */}
            <div className="relative overflow-hidden rounded-3xl border border-cinema-border/80 bg-cinema-card shadow-2xl flex flex-col justify-between min-h-[380px] sm:min-h-[440px] group">
              {/* Background Poster Artwork */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 transition duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: movieA?.backdropPath
                    ? `url(https://image.tmdb.org/t/p/w780${movieA.backdropPath})`
                    : `url(${getTmdbImageUrl(movieA?.posterPath)})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 z-10" />

              {/* Top Details */}
              <div className="relative z-20 p-5 sm:p-6 space-y-2">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold border border-gold/30">
                  Benchmark Film
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {movieA?.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>{movieA?.year}</span>
                  <span>•</span>
                  <span>Dir. {movieA?.director}</span>
                </div>
              </div>

              {/* Bottom Revenue Display */}
              <div className="relative z-20 p-5 sm:p-6 text-center space-y-1 border-t border-white/10 bg-black/60 backdrop-blur-md">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-cinema-muted block">
                  Worldwide Box Office Gross
                </span>
                <div className="text-2xl sm:text-4xl font-black font-mono text-gold drop-shadow-md">
                  {formatFullRevenue(movieA?.revenue)}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold block">
                  ({formatShortRevenue(movieA?.revenue)})
                </span>
              </div>
            </div>

            {/* CARD B (Right Movie - The Contender to Guess) */}
            <div
              className={`relative overflow-hidden rounded-3xl border shadow-2xl flex flex-col justify-between min-h-[380px] sm:min-h-[440px] transition-all duration-300 ${
                isRevealed && lastResult === 'CORRECT'
                  ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-500/20'
                  : isRevealed && lastResult === 'WRONG'
                    ? 'border-rose-500 bg-rose-950/20 shadow-rose-500/20'
                    : 'border-cinema-border/80 bg-cinema-card'
              }`}
            >
              {/* Background Poster Artwork */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30 transition duration-500"
                style={{
                  backgroundImage: movieB?.backdropPath
                    ? `url(https://image.tmdb.org/t/p/w780${movieB.backdropPath})`
                    : `url(${getTmdbImageUrl(movieB?.posterPath)})`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 z-10" />

              {/* Top Details */}
              <div className="relative z-20 p-5 sm:p-6 space-y-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                  The Contender
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {movieB?.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>{movieB?.year}</span>
                  <span>•</span>
                  <span>Dir. {movieB?.director}</span>
                </div>
              </div>

              {/* Bottom Interactive Choice Buttons or Revealed Revenue */}
              <div className="relative z-20 p-5 sm:p-6 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center min-h-[160px]">
                {!isRevealed ? (
                  <div className="w-full space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 text-center block">
                      Has a box office gross...
                    </span>

                    <div className="grid grid-cols-2 gap-3 w-full">
                      {/* HIGHER BUTTON */}
                      <button
                        onClick={() => {
                          if (subMode === 'endless') handleEndlessGuess('HIGHER');
                          else handleDailyGuess('HIGHER');
                        }}
                        className="group flex flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-3 text-white transition active:scale-95 shadow-lg shadow-emerald-600/30 border border-emerald-400/40"
                      >
                        <ArrowUpCircle className="h-6 w-6 text-white group-hover:scale-110 transition" />
                        <span className="text-sm font-black uppercase tracking-wider">HIGHER</span>
                        <span className="text-[10px] text-emerald-200">More than {formatShortRevenue(movieA?.revenue)}</span>
                      </button>

                      {/* LOWER BUTTON */}
                      <button
                        onClick={() => {
                          if (subMode === 'endless') handleEndlessGuess('LOWER');
                          else handleDailyGuess('LOWER');
                        }}
                        className="group flex flex-col items-center justify-center gap-1 rounded-2xl bg-rose-600 hover:bg-rose-500 py-3.5 px-3 text-white transition active:scale-95 shadow-lg shadow-rose-600/30 border border-rose-400/40"
                      >
                        <ArrowDownCircle className="h-6 w-6 text-white group-hover:scale-110 transition" />
                        <span className="text-sm font-black uppercase tracking-wider">LOWER</span>
                        <span className="text-[10px] text-rose-200">Less than {formatShortRevenue(movieA?.revenue)}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Revealed Revenue Animation */
                  <div className="text-center space-y-2 animate-fade-in w-full">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cinema-muted block">
                      Worldwide Box Office Gross
                    </span>

                    <div
                      className={`text-2xl sm:text-4xl font-black font-mono drop-shadow-md ${
                        lastResult === 'CORRECT' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatFullRevenue(movieB?.revenue)}
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black uppercase ${
                          lastResult === 'CORRECT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {lastResult === 'CORRECT' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {lastResult === 'CORRECT' ? 'CORRECT GUESS!' : 'INCORRECT!'}
                      </span>
                    </div>

                    {/* In Daily Mode: Next Round Button */}
                    {subMode === 'daily' && !dailyComplete && (
                      <button
                        onClick={handleNextDailyRound}
                        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gold hover:bg-gold/90 text-cinema-black font-black text-xs px-5 py-2.5 transition active:scale-95 shadow-md mx-auto"
                      >
                        <span>Next Matchup (Round {dailyRound + 2}/5)</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===================================================================== */}
      {/* 4. GAME OVER & RESULTS BANNERS                                        */}
      {/* ===================================================================== */}
      {/* Endless Game Over Banner */}
      {subMode === 'endless' && endlessGameOver && (
        <div className="rounded-3xl border border-rose-500/40 bg-cinema-card p-6 shadow-2xl text-center space-y-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto">
            <Trophy className="h-7 w-7 text-rose-400" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
              Streak Ended
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              You Reached a Streak of {currentStreak}!
            </h2>
            <p className="text-xs text-cinema-muted mt-1">
              {currentStreak >= 10
                ? '⭐ Sensational Box Office Mastery! Hollywood Mogul status.'
                : currentStreak >= 5
                  ? '👏 Great eye for cinema revenues!'
                  : 'Better luck on your next run!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleStartNewEndless}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs font-black text-white transition active:scale-95 shadow-lg shadow-emerald-600/30"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Play Again</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 py-3 text-xs font-black text-slate-200 hover:text-white transition"
            >
              <Share2 className="h-4 w-4" />
              <span>{copiedShare ? 'Copied! 📋' : 'Share Streak'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Daily 5-Round Completion Banner */}
      {subMode === 'daily' && dailyComplete && (
        <div className="rounded-3xl border border-emerald-500/40 bg-cinema-card p-6 shadow-2xl text-center space-y-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto">
            <Trophy className="h-7 w-7 text-gold" />
          </div>

          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              Daily Challenge Complete
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Score: {dailyGuesses.filter(g => g.correct).length} of 5 Correct!
            </h2>
            <p className="text-xs text-cinema-muted mt-1">
              Challenge #{activeDate} is locked in. Come back tomorrow for 5 new matchups!
            </p>
          </div>

          {/* Breakdown Pills */}
          <div className="flex items-center justify-center gap-2">
            {dailyGuesses.map((g, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-black border ${
                  g.correct
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                }`}
              >
                {g.correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>Round {idx + 1}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-black text-white transition active:scale-95 shadow-lg shadow-emerald-600/30"
            >
              <Share2 className="h-4 w-4" />
              <span>{copiedShare ? 'Copied to Clipboard! 📋' : 'Share Result to Friends'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. HOW TO PLAY MODAL                                                  */}
      {/* ===================================================================== */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-cinema-card p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-cinema-border/70">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">How to Play Box Office Clash</h3>
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
                💰 <strong>The Premise:</strong> Test your knowledge of worldwide box office revenues. Did Film B gross higher or lower than Film A?
              </p>
              <p>
                🔥 <strong>Endless Streak Mode:</strong> Keep guessing consecutive matchups. Every correct answer adds +1 to your streak. One mistake and your run ends!
              </p>
              <p>
                📅 <strong>Daily 5-Round Challenge:</strong> 5 curated daily matchups. See how many you can get right out of 5!
              </p>
              <p>
                📊 <strong>Verified Data:</strong> Box office grosses are based on verified global theatrical earnings from TMDB.
              </p>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-black text-white transition active:scale-95"
            >
              Got It, Let's Clash!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
