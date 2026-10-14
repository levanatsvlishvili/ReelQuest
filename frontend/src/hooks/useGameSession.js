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

  useEffect(() => {
    async function init() {
      try {
        const daily = await fetchDailyChallenge();
        setChallenge(daily);
        setCurrentActor(daily.startActor);
        setChain([{ actor: daily.startActor, movie: null }]);
      } catch (err) {
        console.error('Failed to load daily challenge:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (gameStatus !== 'PLAYING' || loading) return;

    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, loading]);

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
    setChain(newChain);
    setCurrentActor(actor);
    setSelectedMovie(null);
    setMoves(prev => prev + 1);

    if (actor.id === challenge.targetActor.id) {
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

      submitGameScore({
        challengeId: challenge.challengeId,
        userId: user?.id || 'guest-cinephile',
        username: user?.username || 'You',
        hops: moves + 1,
        durationSeconds: timerSeconds,
        startActorId: challenge.startActor.id,
        targetActorId: challenge.targetActor.id,
        path: submittedPath,
        isPro: user?.isPro || false
      });

      recordGame({
        date: challenge.date,
        won: true,
        hops: moves + 1,
        durationSeconds: timerSeconds
      });
    }
  }, [selectedMovie, currentActor, challenge, chain, moves, timerSeconds, user, recordGame]);

  const undoLastMove = useCallback(() => {
    if (chain.length <= 1 || gameStatus !== 'PLAYING') return;

    const newChain = chain.slice(0, -1);
    const prevNode = newChain[newChain.length - 1];

    setChain(newChain);
    setCurrentActor(prevNode.actor);
    setSelectedMovie(null);
    setMoves(prev => Math.max(0, prev - 1));
  }, [chain, gameStatus]);

  const undoToStep = useCallback((targetIndex) => {
    if (targetIndex < 0 || targetIndex >= chain.length - 1 || gameStatus !== 'PLAYING') return;

    const newChain = chain.slice(0, targetIndex + 1);
    const targetNode = newChain[targetIndex];

    setChain(newChain);
    setCurrentActor(targetNode.actor);
    setSelectedMovie(null);
    setMoves(targetIndex);
  }, [chain, gameStatus]);

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
  }, [challenge]);

  const giveUp = useCallback(() => {
    if (!challenge) return;
    setGameStatus('GAVE_UP');
    fetchOptimalPath(challenge.startActor.id, challenge.targetActor.id)
      .then(shortest => setOptimalPath(shortest || []));
    setShowVictory(true);

    recordGame({
      date: challenge.date,
      won: false,
      hops: moves,
      durationSeconds: timerSeconds
    });
  }, [challenge, moves, timerSeconds, recordGame]);

  return {
    challenge,
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
    giveUp
  };
}
