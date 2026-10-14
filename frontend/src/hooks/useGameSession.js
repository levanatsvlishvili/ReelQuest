import { useState, useEffect, useCallback } from 'react';
import {
  fetchDailyChallenge,
  fetchActorMovies,
  fetchMovieCast,
  fetchOptimalPath,
  submitGameScore
} from '../api/client';
import { useAuth } from '../context/AuthContext';

export function useGameSession() {
  const { user, recordGame } = useAuth();
  const todayStr = new Date().toISOString().slice(0, 10);

  const [activeDate, setActiveDate] = useState(todayStr);
  const [isCustom, setIsCustom] = useState(false);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentActor, setCurrentActor] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [chain, setChain] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [gameStatus, setGameStatus] = useState('PLAYING');
  const [optimalPath, setOptimalPath] = useState([]);
  const [showVictory, setShowVictory] = useState(false);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [availableCast, setAvailableCast] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [castLoading, setCastLoading] = useState(false);

  // Helper to save session
  const saveSession = useCallback((cId, stateObj) => {
    if (!cId) return;
    try {
      localStorage.setItem(`reelquest_session_${cId}`, JSON.stringify(stateObj));
    } catch (e) {
      console.warn('Failed to save session to localStorage:', e);
    }
  }, []);

  // Helper to load session
  const loadSession = useCallback((cId) => {
    if (!cId) return null;
    try {
      const raw = localStorage.getItem(`reelquest_session_${cId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse saved session:', e);
    }
    return null;
  }, []);

  // Load a daily challenge for a specific date
  const loadDateChallenge = useCallback(async (targetDateStr) => {
    setLoading(true);
    setSelectedMovie(null);
    setShowVictory(false);
    setIsCustom(false);
    setActiveDate(targetDateStr);

    try {
      const daily = await fetchDailyChallenge(targetDateStr);
      setChallenge(daily);

      const saved = loadSession(daily.challengeId);
      if (saved && saved.chain && saved.chain.length > 0) {
        setChain(saved.chain);
        setCurrentActor(saved.currentActor || saved.chain[saved.chain.length - 1].actor);
        setMoves(saved.moves || 0);
        setTimerSeconds(saved.timerSeconds || 0);
        setGameStatus(saved.gameStatus || 'PLAYING');
        if (saved.gameStatus === 'WON' || saved.gameStatus === 'GAVE_UP') {
          setShowVictory(true);
          fetchOptimalPath(daily.startActor.id, daily.targetActor.id)
            .then(shortest => setOptimalPath(shortest || []));
        }
      } else {
        setCurrentActor(daily.startActor);
        setChain([{ actor: daily.startActor, movie: null }]);
        setMoves(0);
        setTimerSeconds(0);
        setGameStatus('PLAYING');
        setOptimalPath([]);
      }
    } catch (err) {
      console.error('Failed to load challenge for date:', targetDateStr, err);
    } finally {
      setLoading(false);
    }
  }, [loadSession]);

  // Initial load
  useEffect(() => {
    loadDateChallenge(todayStr);
  }, [loadDateChallenge, todayStr]);

  // Play a custom challenge (from PRO Path Finder)
  const loadCustomChallenge = useCallback((customData) => {
    setLoading(true);
    setIsCustom(true);
    setSelectedMovie(null);
    setShowVictory(false);
    setOptimalPath([]);

    const challengeObj = {
      challengeId: customData.challengeId || `custom-${customData.startActor.id}-${customData.targetActor.id}`,
      date: 'Custom',
      startActor: customData.startActor,
      targetActor: customData.targetActor,
      optimalHops: customData.optimalHops || 2
    };

    setChallenge(challengeObj);
    setCurrentActor(customData.startActor);
    setChain([{ actor: customData.startActor, movie: null }]);
    setMoves(0);
    setTimerSeconds(0);
    setGameStatus('PLAYING');
    setLoading(false);
  }, []);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'PLAYING' || loading) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, loading]);

  // Fetch movies for current actor
  useEffect(() => {
    if (!currentActor) {
      setAvailableMovies([]);
      return;
    }
    let cancelled = false;
    setMoviesLoading(true);
    fetchActorMovies(currentActor.id)
      .then(movies => {
        if (!cancelled) {
          setAvailableMovies(movies || []);
          setMoviesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setMoviesLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentActor]);

  // Fetch cast for selected movie
  useEffect(() => {
    if (!selectedMovie || !currentActor) {
      setAvailableCast([]);
      return;
    }
    let cancelled = false;
    setCastLoading(true);
    fetchMovieCast(selectedMovie.id, currentActor.id)
      .then(cast => {
        if (!cancelled) {
          setAvailableCast(cast || []);
          setCastLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setCastLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedMovie, currentActor]);

  const selectMovie = useCallback((movie) => {
    setSelectedMovie(movie);
  }, []);

  const clearSelectedMovie = useCallback(() => {
    setSelectedMovie(null);
  }, []);

  const selectActor = useCallback((actor) => {
    if (!selectedMovie || !currentActor || !challenge) return;

    const newChain = [
      ...chain,
      { actor, movie: selectedMovie, character: actor.character }
    ];
    const newMoves = moves + 1;
    setChain(newChain);
    setCurrentActor(actor);
    setSelectedMovie(null);
    setMoves(newMoves);

    const isWin = actor.id === challenge.targetActor.id;
    const newStatus = isWin ? 'WON' : 'PLAYING';

    saveSession(challenge.challengeId, {
      chain: newChain,
      currentActor: actor,
      moves: newMoves,
      timerSeconds,
      gameStatus: newStatus
    });

    if (isWin) {
      setGameStatus('WON');
      setShowVictory(true);

      fetchOptimalPath(challenge.startActor.id, challenge.targetActor.id)
        .then(shortest => setOptimalPath(shortest || []));

      const submittedPath = [];
      for (let i = 1; i < newChain.length; i++) {
        submittedPath.push({
          fromActorId: newChain[i - 1].actor.id,
          movieId: newChain[i].movie.id,
          toActorId: newChain[i].actor.id
        });
      }

      if (!isCustom) {
        submitGameScore({
          challengeId: challenge.challengeId,
          userId: user?.id || 'guest-cinephile',
          username: user?.username || 'You',
          hops: newMoves,
          durationSeconds: timerSeconds,
          startActorId: challenge.startActor.id,
          targetActorId: challenge.targetActor.id,
          path: submittedPath,
          isPro: user?.isPro || false
        });

        recordGame({
          date: challenge.date,
          won: true,
          hops: newMoves,
          durationSeconds: timerSeconds
        });
      }
    }
  }, [selectedMovie, currentActor, challenge, chain, moves, timerSeconds, user, recordGame, isCustom, saveSession]);

  const undoLastMove = useCallback(() => {
    if (chain.length <= 1 || gameStatus !== 'PLAYING' || !challenge) return;

    const newChain = chain.slice(0, -1);
    const prevNode = newChain[newChain.length - 1];
    const newMoves = Math.max(0, moves - 1);

    setChain(newChain);
    setCurrentActor(prevNode.actor);
    setSelectedMovie(null);
    setMoves(newMoves);

    saveSession(challenge.challengeId, {
      chain: newChain,
      currentActor: prevNode.actor,
      moves: newMoves,
      timerSeconds,
      gameStatus
    });
  }, [chain, gameStatus, challenge, moves, timerSeconds, saveSession]);

  const undoToStep = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= chain.length - 1 || gameStatus !== 'PLAYING' || !challenge) return;

    const newChain = chain.slice(0, targetIndex + 1);
    const targetNode = newChain[targetIndex];
    const newMoves = targetIndex;

    setChain(newChain);
    setCurrentActor(targetNode.actor);
    setSelectedMovie(null);
    setMoves(newMoves);

    saveSession(challenge.challengeId, {
      chain: newChain,
      currentActor: targetNode.actor,
      moves: newMoves,
      timerSeconds,
      gameStatus
    });
  }, [chain, gameStatus, challenge, timerSeconds, saveSession]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Backspace' || (e.ctrlKey && e.key === 'z')) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        if (chain.length > 1 && gameStatus === 'PLAYING') {
          e.preventDefault();
          undoLastMove();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chain.length, gameStatus, undoLastMove]);

  const restartGame = useCallback(() => {
    if (!challenge) return;
    setCurrentActor(challenge.startActor);
    setSelectedMovie(null);
    setChain([{ actor: challenge.startActor, movie: null }]);
    setMoves(0);
    setTimerSeconds(0);
    setGameStatus('PLAYING');
    setShowVictory(false);

    saveSession(challenge.challengeId, {
      chain: [{ actor: challenge.startActor, movie: null }],
      currentActor: challenge.startActor,
      moves: 0,
      timerSeconds: 0,
      gameStatus: 'PLAYING'
    });
  }, [challenge, saveSession]);

  const giveUp = useCallback(() => {
    if (!challenge) return;
    setGameStatus('GAVE_UP');
    fetchOptimalPath(challenge.startActor.id, challenge.targetActor.id)
      .then(shortest => setOptimalPath(shortest || []));
    setShowVictory(true);

    saveSession(challenge.challengeId, {
      chain,
      currentActor,
      moves,
      timerSeconds,
      gameStatus: 'GAVE_UP'
    });

    if (!isCustom) {
      recordGame({
        date: challenge.date,
        won: false,
        hops: moves,
        durationSeconds: timerSeconds
      });
    }
  }, [challenge, moves, timerSeconds, recordGame, isCustom, saveSession, chain, currentActor]);

  function shiftDateStr(dateStr, days) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + days));
    return d.toISOString().slice(0, 10);
  }

  // Navigate to previous day
  const goToPrevDay = useCallback(() => {
    const prevDateStr = shiftDateStr(activeDate, -1);
    loadDateChallenge(prevDateStr);
  }, [activeDate, loadDateChallenge]);

  // Navigate to next day
  const goToNextDay = useCallback(() => {
    if (activeDate >= todayStr) return;
    const nextDateStr = shiftDateStr(activeDate, 1);
    if (nextDateStr <= todayStr) {
      loadDateChallenge(nextDateStr);
    }
  }, [activeDate, todayStr, loadDateChallenge]);

  return {
    challenge,
    activeDate,
    isToday: activeDate === todayStr && !isCustom,
    isCustom,
    loading,
    currentActor,
    selectedMovie,
    chain,
    moves,
    timerSeconds,
    gameStatus,
    optimalPath,
    availableMovies,
    availableCast,
    moviesLoading,
    castLoading,
    showVictory,
    setShowVictory,
    selectMovie,
    clearSelectedMovie,
    selectActor,
    undoLastMove,
    undoToStep,
    restartGame,
    giveUp,
    loadDateChallenge,
    loadCustomChallenge,
    goToPrevDay,
    goToNextDay
  };
}
