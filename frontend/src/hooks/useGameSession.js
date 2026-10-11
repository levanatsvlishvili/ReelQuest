import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchDailyChallenge,
  getActorMovies,
  getMovieCast,
  findLocalShortestPath,
  submitGameScore
} from '../api/client';

export function useGameSession() {
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

  const availableMovies = useMemo(() => {
    if (!currentActor) return [];
    return getActorMovies(currentActor.id);
  }, [currentActor]);

  const availableCast = useMemo(() => {
    if (!selectedMovie || !currentActor) return [];
    return getMovieCast(selectedMovie.id, currentActor.id);
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
      const shortest = findLocalShortestPath(challenge.startActor.id, challenge.targetActor.id);
      setOptimalPath(shortest);
      setShowVictory(true);

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
        userId: 'local-cinephile',
        username: 'You',
        hops: moves + 1,
        durationSeconds: timerSeconds,
        startActorId: challenge.startActor.id,
        targetActorId: challenge.targetActor.id,
        path: submittedPath
      });
    }
  }, [selectedMovie, currentActor, challenge, chain, moves, timerSeconds]);

  const undoLastMove = useCallback(() => {
    if (chain.length <= 1 || gameStatus !== 'PLAYING') return;

    const newChain = chain.slice(0, -1);
    const prevNode = newChain[newChain.length - 1];

    setChain(newChain);
    setCurrentActor(prevNode.actor);
    setSelectedMovie(null);
    setMoves(prev => Math.max(0, prev - 1));
  }, [chain, gameStatus]);

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
    const shortest = findLocalShortestPath(challenge.startActor.id, challenge.targetActor.id);
    setOptimalPath(shortest);
    setShowVictory(true);
  }, [challenge]);

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
    showVictory,
    setShowVictory,
    selectMovie,
    clearSelectedMovie,
    selectActor,
    undoLastMove,
    restartGame,
    giveUp
  };
}
