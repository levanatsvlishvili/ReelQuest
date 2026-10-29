import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Swords,
  Copy,
  Check,
  Share2,
  Trophy,
  Clock,
  Footprints,
  ArrowLeft,
  Play,
  Users,
  Sparkles,
  RefreshCw,
  Crown,
  UserCheck,
  Loader2,
  AlertCircle,
  Undo2,
  Shuffle,
  Search,
  Film,
  ArrowRight,
  Flag,
  Zap,
  Radio,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  createDuel,
  fetchDuel,
  joinDuel,
  updateDuelProgress,
  submitDuelScore,
  rematchDuel,
  fetchActorMovies,
  fetchMovieCast,
  fetchPopularActors,
  fetchOptimalPath,
  getTmdbImageUrl
} from '../api/client';
import { saveDetailedMatch } from '../api/matchHistory';
import { useAuth } from '../context/AuthContext';
import { VisualGraph } from './VisualGraph';
import { ChainBuilder } from './ChainBuilder';
import {
  playClick,
  playNodeConnect,
  playCountdownTick,
  playOpponentMove,
  playEmote,
  playVictory,
  playDefeat,
  isSoundMuted,
  toggleSound,
  subscribeSoundMuted
} from '../utils/soundEffects';

const EMOTE_OPTIONS = ['🔥', '🤔', '⚡', '🎬', '👏'];

// Per-tab persistent player identity so a user can even test 1v1 across two browser tabs
function getTabPlayerId(user) {
  let tabId = sessionStorage.getItem('reelquest_duel_tab_id');
  if (!tabId) {
    tabId = 'player-' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('reelquest_duel_tab_id', tabId);
  }
  return user?.userId ? `${user.userId}_${tabId}` : tabId;
}

function getStoredRole(duelId) {
  if (!duelId) return null;
  return sessionStorage.getItem(`reelquest_duel_role_${duelId}`);
}

function setStoredRole(duelId, role) {
  if (!duelId || !role) return;
  sessionStorage.setItem(`reelquest_duel_role_${duelId}`, role);
}

export function computeDuelWinner(duel) {
  if (!duel) {
    return {
      isCompleted: false,
      winnerRole: null,
      winnerName: null,
      title: 'Duel In Progress',
      subtitle: 'Waiting for match to finish...',
      isTie: false
    };
  }

  const hostForfeited = Boolean(duel.hostForfeited);
  const guestForfeited = Boolean(duel.guestForfeited);
  const hostFinished = duel.hostMoves !== null && duel.hostMoves !== undefined;
  const guestFinished = duel.guestMoves !== null && duel.guestMoves !== undefined;

  const hostName = duel.hostUsername || 'Host';
  const guestName = duel.guestUsername || 'Challenger';

  const isCompleted =
    duel.status === 'COMPLETED' ||
    hostForfeited ||
    guestForfeited ||
    (hostFinished && guestFinished);

  if (!isCompleted) {
    return {
      isCompleted: false,
      winnerRole: null,
      winnerName: null,
      title: 'Your Run is Locked In! Watching Opponent Live...',
      subtitle: 'Match in progress',
      isTie: false
    };
  }

  // 1. Both forfeited -> Tie
  if (hostForfeited && guestForfeited) {
    return {
      isCompleted: true,
      winnerRole: 'TIE',
      winnerName: null,
      title: "Both Players Forfeited — It's a Tie!",
      subtitle: 'No winner declared as both cinephiles gave up',
      isTie: true
    };
  }

  // 2. One player forfeited
  if (hostForfeited) {
    return {
      isCompleted: true,
      winnerRole: 'GUEST',
      winnerName: guestName,
      title: `🏆 ${guestName} Wins the Duel!`,
      subtitle: `${hostName} forfeited the match`,
      isTie: false
    };
  }

  if (guestForfeited) {
    return {
      isCompleted: true,
      winnerRole: 'HOST',
      winnerName: hostName,
      title: `🏆 ${hostName} Wins the Duel!`,
      subtitle: `${guestName} forfeited the match`,
      isTie: false
    };
  }

  // 3. Both finished: compare moves (hops) first
  const hMoves = Number(duel.hostMoves || 0);
  const gMoves = Number(duel.guestMoves || 0);

  if (hMoves < gMoves) {
    return {
      isCompleted: true,
      winnerRole: 'HOST',
      winnerName: hostName,
      title: `🏆 ${hostName} Wins the Duel!`,
      subtitle: `Shorter Hollywood path (${hMoves} vs ${gMoves} hops)`,
      isTie: false
    };
  }

  if (gMoves < hMoves) {
    return {
      isCompleted: true,
      winnerRole: 'GUEST',
      winnerName: guestName,
      title: `🏆 ${guestName} Wins the Duel!`,
      subtitle: `Shorter Hollywood path (${gMoves} vs ${hMoves} hops)`,
      isTie: false
    };
  }

  // 4. Equal hops: compare duration (time in seconds)
  const hDuration = Number(duel.hostDurationSeconds ?? duel.hostTimeSeconds ?? 0);
  const gDuration = Number(duel.guestDurationSeconds ?? duel.guestTimeSeconds ?? 0);

  if (hDuration < gDuration) {
    return {
      isCompleted: true,
      winnerRole: 'HOST',
      winnerName: hostName,
      title: `🏆 ${hostName} Wins the Duel!`,
      subtitle: `Equal hops (${hMoves}), but faster execution (${hDuration}s vs ${gDuration}s)`,
      isTie: false
    };
  }

  if (gDuration < hDuration) {
    return {
      isCompleted: true,
      winnerRole: 'GUEST',
      winnerName: guestName,
      title: `🏆 ${guestName} Wins the Duel!`,
      subtitle: `Equal hops (${gMoves}), but faster execution (${gDuration}s vs ${hDuration}s)`,
      isTie: false
    };
  }

  // 5. Exact dead-heat tie on both hops and duration
  return {
    isCompleted: true,
    winnerRole: 'TIE',
    winnerName: null,
    title: "It's an Exact Dead-Heat Tie!",
    subtitle: `Both cinephiles finished in exactly ${hMoves} hops and ${hDuration}s!`,
    isTie: true
  };
}

export function DuelGameView({ onBackToMain }) {
  const { user } = useAuth();
  const myPlayerId = getTabPlayerId(user);
  const defaultUsername = user?.nickname || user?.email?.split('@')[0] || 'Cinephile';

  // Phases: 'MENU' | 'LOBBY_WAIT' | 'COUNTDOWN' | 'PLAYING' | 'RESULTS'
  const [phase, setPhase] = useState('MENU');
  const [duel, setDuel] = useState(null);
  const [myRole, setMyRole] = useState(null); // 'HOST' | 'GUEST'
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [customNickname, setCustomNickname] = useState(defaultUsername);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lobby creation options: 'RANDOM' | 'CUSTOM'
  const [challengeType, setChallengeType] = useState('RANDOM');
  const [actorsList, setActorsList] = useState([]);
  const [startActorPick, setStartActorPick] = useState(null);
  const [targetActorPick, setTargetActorPick] = useState(null);
  const [startSearch, setStartSearch] = useState('');
  const [targetSearch, setTargetSearch] = useState('');
  const [startDropdownOpen, setStartDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  // Countdown state (5 -> 0)
  const [countdownLeft, setCountdownLeft] = useState(5);
  const countdownTriggeredRef = useRef(null);

  // Gameplay state
  const [currentActor, setCurrentActor] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [chain, setChain] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [availableMovies, setAvailableMovies] = useState([]);
  const [availableCast, setAvailableCast] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [castLoading, setCastLoading] = useState(false);
  const [activeEmote, setActiveEmote] = useState(null);

  // Otara's Optimal Path for Post-Match Reveal
  const [optimalPath, setOptimalPath] = useState([]);
  const [optimalLoading, setOptimalLoading] = useState(false);

  // Sound effects & Opponent live telemetry triggers
  const [muted, setMuted] = useState(isSoundMuted());
  const [opponentFlash, setOpponentFlash] = useState(false);
  const [rematchAlert, setRematchAlert] = useState(null);
  const prevOpponentMovesRef = useRef(null);
  const prevOpponentEmoteRef = useRef(null);

  useEffect(() => {
    return subscribeSoundMuted((newMuted) => setMuted(newMuted));
  }, []);

  const handleToggleSound = () => {
    const next = toggleSound();
    setMuted(next);
  };

  const timerRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (user?.nickname) {
      setCustomNickname(user.nickname);
    }
  }, [user]);

  // Load popular actors for Custom Lobby picker
  useEffect(() => {
    fetchPopularActors()
      .then((list) => {
        if (Array.isArray(list) && list.length >= 2) {
          setActorsList(list);
          setStartActorPick(list[0]);
          setStartSearch(list[0].name);
          setTargetActorPick(list[1]);
          setTargetSearch(list[1].name);
        }
      })
      .catch(() => {});
  }, []);

  // Load Otara's optimal path whenever duel actors are available
  useEffect(() => {
    const startId = duel?.startActor?.id;
    const targetId = duel?.targetActor?.id;
    if (!startId || !targetId) return;

    setOptimalLoading(true);
    fetchOptimalPath(startId, targetId)
      .then((path) => {
        setOptimalPath(Array.isArray(path) ? path : []);
        setOptimalLoading(false);
      })
      .catch(() => setOptimalLoading(false));
  }, [duel?.startActor?.id, duel?.targetActor?.id]);

  // Prepare the initial actor node & pre-fetch filmography so gameplay starts at 0ms after countdown
  const prepareMatchArena = useCallback((duelData) => {
    if (!duelData?.startActor) return;
    setCurrentActor(duelData.startActor);
    setSelectedMovie(null);
    setChain([{ actor: duelData.startActor, movie: null }]);
    setMoves(0);
    setTimerSeconds(0);
    setAvailableCast([]);
    setActiveEmote(null);
    setOpponentFlash(false);
    setError('');
    prevOpponentMovesRef.current = null;
    prevOpponentEmoteRef.current = null;
    setMoviesLoading(true);
    fetchActorMovies(duelData.startActor.id)
      .then((movies) => {
        setAvailableMovies(movies || []);
        setMoviesLoading(false);
      })
      .catch(() => setMoviesLoading(false));
  }, []);

  // Check URL query param `?duel=XXXX` on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duelParam = params.get('duel');
    if (duelParam) {
      setJoinCodeInput(duelParam.toUpperCase());
      handleLoadOrJoinDuel(duelParam.toLowerCase());
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Start the 5-second synchronized countdown and then launch PLAYING
  const triggerSynchronizedCountdown = useCallback((duelData, role) => {
    if (!duelData?.duelId) return;
    if (countdownTriggeredRef.current === duelData.duelId) return;
    countdownTriggeredRef.current = duelData.duelId;

    prepareMatchArena(duelData);
    setMyRole(role);
    setPhase('COUNTDOWN');

    // Compute remaining countdown based on server countdownStartedAt (bounded between 3s and 5s so both players always see the dramatic countdown)
    let initialSec = 5;
    if (duelData.countdownStartedAt) {
      const elapsedSec = Math.floor((Date.now() - duelData.countdownStartedAt) / 1000);
      if (elapsedSec >= 0 && elapsedSec <= 2) {
        initialSec = Math.max(3, 5 - elapsedSec);
      }
    }
    setCountdownLeft(initialSec);
  }, [prepareMatchArena]);

  // Manage the 5 -> 4 -> 3 -> 2 -> 1 -> GO! interval
  useEffect(() => {
    if (phase !== 'COUNTDOWN') return;
    if (countdownLeft <= 0) {
      setPhase('PLAYING');
      return;
    }
    playCountdownTick(countdownLeft === 1);
    const t = setTimeout(() => {
      setCountdownLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, countdownLeft]);

  // Active gameplay stopwatch timer
  useEffect(() => {
    if (phase === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Real-time 1.2s polling during LOBBY_WAIT, COUNTDOWN, PLAYING, and RESULTS
  useEffect(() => {
    if (!duel?.duelId || phase === 'MENU') return;

    pollRef.current = setInterval(async () => {
      try {
        const updated = await fetchDuel(duel.duelId);
        if (!updated) return;
        setDuel(updated);

        const role = myRole || getStoredRole(updated.duelId) || 'HOST';

        // 1. If in LOBBY_WAIT and guest has joined -> start 5-second synchronized countdown!
        if (
          phase === 'LOBBY_WAIT' &&
          (updated.status === 'IN_PROGRESS' || updated.guestUsername)
        ) {
          triggerSynchronizedCountdown(updated, role);
        }

        // 2. If in PLAYING, monitor opponent live hops and reactions
        if (phase === 'PLAYING') {
          const oppMoves = role === 'HOST' ? updated.guestLiveMoves : updated.hostLiveMoves;
          if (typeof oppMoves === 'number' && prevOpponentMovesRef.current !== null && oppMoves > prevOpponentMovesRef.current) {
            playOpponentMove();
            setOpponentFlash(true);
            setTimeout(() => setOpponentFlash(false), 1400);
          }
          prevOpponentMovesRef.current = oppMoves;

          const oppEmote = role === 'HOST' ? updated.guestEmote : updated.hostEmote;
          if (oppEmote && oppEmote !== prevOpponentEmoteRef.current) {
            playEmote();
          }
          prevOpponentEmoteRef.current = oppEmote;
        }

        // 3. If in RESULTS, keep match history updated with final outcome once opponent finishes
        if (phase === 'RESULTS' && updated) {
          const comp = computeDuelWinner(updated);
          if (comp.isCompleted) {
            const isWinner = comp.winnerRole === role;
            const isForfeit = Boolean(role === 'HOST' ? updated.hostForfeited : updated.guestForfeited);
            const myHops = role === 'HOST' ? updated.hostMoves : updated.guestMoves;
            const myDuration = role === 'HOST'
              ? (updated.hostDurationSeconds ?? updated.hostTimeSeconds)
              : (updated.guestDurationSeconds ?? updated.guestTimeSeconds);
            try {
              saveDetailedMatch(user?.id, {
                id: `duel_${updated.duelId}_${myPlayerId}`,
                gameMode: 'duels',
                subMode: 'duel',
                date: new Date().toISOString().slice(0, 10),
                timestamp: new Date().toISOString(),
                won: isWinner,
                forfeited: isForfeit,
                hops: typeof myHops === 'number' ? myHops : 0,
                optimalHops: updated.optimalHops || null,
                matchedOtara: updated.optimalHops ? myHops <= updated.optimalHops : false,
                durationSeconds: myDuration || 0,
                startActor: updated.startActor,
                targetActor: updated.targetActor,
                opponentName: role === 'HOST' ? updated.guestUsername : updated.hostUsername,
                roomCode: updated.duelId,
                duelOutcome: isWinner ? 'VICTORY' : (isForfeit ? 'FORFEITED' : (comp.isTie ? 'TIE' : 'DEFEAT'))
              });
            } catch (err) {}
          }
        }

        // 4. If in RESULTS and either player clicked Instant Rematch (`nextDuelId` created) -> auto-join the rematch!
        if (phase === 'RESULTS' && updated.nextDuelId && updated.nextDuelId !== duel.duelId) {
          setRematchAlert('Opponent requested an Instant Rematch! Launching...');
          playNodeConnect();
          const nextDuel = await fetchDuel(updated.nextDuelId);
          if (nextDuel) {
            countdownTriggeredRef.current = null;
            setTimeout(() => {
              setStoredRole(nextDuel.duelId, role);
              setDuel(nextDuel);
              const url = new URL(window.location.href);
              url.searchParams.set('duel', nextDuel.duelId);
              window.history.replaceState({}, '', url.toString());
              setRematchAlert(null);
              triggerSynchronizedCountdown(nextDuel, role);
            }, 1000);
          }
        }
      } catch (e) {
        // Ignore transient poll errors
      }
    }, 1200);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [duel?.duelId, phase, myRole, triggerSynchronizedCountdown]);

  const filterActors = (query) => {
    if (!query || query.trim().length === 0) return actorsList.slice(0, 8);
    const q = query.toLowerCase().trim();
    return actorsList.filter((a) => a.name.toLowerCase().includes(q)).slice(0, 8);
  };

  const handleShuffleCustomActors = () => {
    if (actorsList.length < 2) return;
    const i1 = Math.floor(Math.random() * Math.min(80, actorsList.length));
    let i2 = Math.floor(Math.random() * Math.min(80, actorsList.length));
    while (i2 === i1) {
      i2 = Math.floor(Math.random() * Math.min(80, actorsList.length));
    }
    setStartActorPick(actorsList[i1]);
    setStartSearch(actorsList[i1].name);
    setTargetActorPick(actorsList[i2]);
    setTargetSearch(actorsList[i2].name);
    setError('');
  };

  const handleLoadOrJoinDuel = async (code) => {
    if (!code || code.trim().length < 3) {
      setError('Please enter a valid Duel Room Code.');
      return;
    }
    setError('');
    setLoadingAction(true);
    try {
      const normalized = code.trim().toLowerCase();
      const existing = await fetchDuel(normalized);
      if (!existing) {
        setError('Duel lobby not found. Check the room code and try again.');
        setLoadingAction(false);
        return;
      }

      const storedRole = getStoredRole(normalized);

      // Update URL parameter cleanly
      const url = new URL(window.location.href);
      url.searchParams.set('duel', normalized);
      window.history.replaceState({}, '', url.toString());

      // Case A: We created this room on this tab (HOST)
      if (storedRole === 'HOST' || existing.hostUserId === myPlayerId) {
        setMyRole('HOST');
        setStoredRole(normalized, 'HOST');
        setDuel(existing);
        if (existing.hostMoves !== null && existing.hostMoves !== undefined) {
          setPhase('RESULTS');
        } else if (existing.status === 'IN_PROGRESS' || existing.guestUsername) {
          triggerSynchronizedCountdown(existing, 'HOST');
        } else {
          setPhase('LOBBY_WAIT');
        }
        setLoadingAction(false);
        return;
      }

      // Case B: Joining as GUEST (or reconnecting as GUEST)
      const joined = await joinDuel(normalized, {
        playerId: myPlayerId,
        nickname: customNickname || defaultUsername
      });

      setMyRole('GUEST');
      setStoredRole(normalized, 'GUEST');
      setDuel(joined);

      if (joined.guestMoves !== null && joined.guestMoves !== undefined) {
        setPhase('RESULTS');
      } else {
        triggerSynchronizedCountdown(joined, 'GUEST');
      }
    } catch (err) {
      setError('Could not join duel lobby. Please check the code.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateLobby = async () => {
    setError('');
    if (challengeType === 'CUSTOM') {
      if (!startActorPick || !targetActorPick) {
        setError('Please select both a Starting Actor and a Target Actor.');
        return;
      }
      if (startActorPick.id === targetActorPick.id) {
        setError('Starting Actor and Target Actor must be two different stars!');
        return;
      }
    }

    setLoadingAction(true);
    try {
      const payload = {
        challengeMode: challengeType,
        hostUserId: myPlayerId,
        hostNickname: customNickname || defaultUsername
      };

      if (challengeType === 'CUSTOM' && startActorPick && targetActorPick) {
        payload.startActorId = startActorPick.id;
        payload.startActorName = startActorPick.name;
        payload.startActorImage = startActorPick.profilePath;
        payload.targetActorId = targetActorPick.id;
        payload.targetActorName = targetActorPick.name;
        payload.targetActorImage = targetActorPick.profilePath;
      }

      const created = await createDuel(payload);
      countdownTriggeredRef.current = null;
      setMyRole('HOST');
      setStoredRole(created.duelId, 'HOST');
      setDuel(created);
      setPhase('LOBBY_WAIT');

      const url = new URL(window.location.href);
      url.searchParams.set('duel', created.duelId);
      window.history.replaceState({}, '', url.toString());
    } catch (err) {
      setError('Failed to create 1v1 lobby. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Broadcast live progress to opponent
  const broadcastProgress = async (nextMoves, nextActorName, actionText, emote = null) => {
    if (!duel?.duelId) return;
    const role = myRole || getStoredRole(duel.duelId) || 'HOST';
    try {
      const updated = await updateDuelProgress(duel.duelId, {
        playerId: myPlayerId,
        role,
        currentMoves: nextMoves,
        currentActorName: nextActorName,
        lastAction: actionText,
        emote
      });
      if (updated) setDuel(updated);
    } catch (e) {
      // Non-blocking telemetry update
    }
  };

  const handleSendEmote = (emoji) => {
    playEmote();
    setActiveEmote(emoji);
    setTimeout(() => setActiveEmote(null), 2000);
    broadcastProgress(moves, currentActor?.name || '', `Sent ${emoji}`, emoji);
  };

  // Format chain into a readable string summary for post-game comparison
  const buildPathSummaryString = (chainArr) => {
    if (!Array.isArray(chainArr) || chainArr.length === 0) return '';
    const parts = [];
    for (let i = 0; i < chainArr.length; i++) {
      const node = chainArr[i];
      if (node.movie?.title) {
        parts.push(`[${node.movie.title}]`);
      }
      if (node.actor?.name) {
        parts.push(node.actor.name);
      }
    }
    return parts.join(' → ');
  };

  // Gameplay interactions
  const handleSelectMovie = async (movie) => {
    playClick();
    setSelectedMovie(movie);
    setCastLoading(true);
    broadcastProgress(moves, currentActor?.name, `Inspecting "${movie.title}"...`);
    try {
      const cast = await fetchMovieCast(movie.id);
      setAvailableCast((cast || []).filter((a) => a.id !== currentActor?.id));
    } catch (e) {
      setAvailableCast([]);
    } finally {
      setCastLoading(false);
    }
  };

  const handleSelectActor = async (actor) => {
    if (!selectedMovie) return;
    const newMoves = moves + 1;
    const newChain = [...chain, { actor, movie: selectedMovie }];

    setChain(newChain);
    setCurrentActor(actor);
    setSelectedMovie(null);
    setMoves(newMoves);
    setAvailableCast([]);

    // Check if target actor reached!
    if (String(actor.id) === String(duel?.targetActor?.id)) {
      playVictory();
      if (timerRef.current) clearInterval(timerRef.current);
      const role = myRole || getStoredRole(duel.duelId) || 'HOST';
      const pathSummary = buildPathSummaryString(newChain);
      try {
        const updated = await submitDuelScore(duel.duelId, {
          playerId: myPlayerId,
          role,
          nickname: customNickname || defaultUsername,
          moves: newMoves,
          durationSeconds: timerSeconds,
          timeSeconds: timerSeconds,
          forfeited: false,
          pathSummary
        });
        setDuel(updated);

        try {
          saveDetailedMatch(user?.id, {
            id: `duel_${duel.duelId}_${myPlayerId}`,
            gameMode: 'duels',
            subMode: 'duel',
            date: new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString(),
            won: updated?.winner === role || (updated?.winner === null),
            forfeited: false,
            hops: newMoves,
            optimalHops: duel.optimalHops || null,
            matchedOtara: duel.optimalHops ? newMoves <= duel.optimalHops : false,
            durationSeconds: timerSeconds,
            startActor: duel.startActor,
            targetActor: duel.targetActor,
            opponentName: role === 'HOST' ? (duel.guestUsername || 'Opponent') : duel.hostUsername,
            roomCode: duel.duelId,
            duelOutcome: updated?.winner === role ? 'VICTORY' : 'COMPLETED'
          });
        } catch (err) {}
      } catch (e) {
        // Fallback already handled in client.js
      }
      setPhase('RESULTS');
      return;
    }

    // Broadcast hop to opponent in real-time
    playNodeConnect();
    broadcastProgress(
      newMoves,
      actor.name,
      `Hop #${newMoves}: ${selectedMovie.title} → ${actor.name}`
    );

    setMoviesLoading(true);
    try {
      const movies = await fetchActorMovies(actor.id);
      setAvailableMovies(movies || []);
    } catch (e) {
      setAvailableMovies([]);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleUndo = async () => {
    if (chain.length <= 1) return;
    playClick();
    const newChain = chain.slice(0, -1);
    const prevActor = newChain[newChain.length - 1].actor;
    const nextMoves = Math.max(0, moves - 1);
    setChain(newChain);
    setCurrentActor(prevActor);
    setSelectedMovie(null);
    setMoves(nextMoves);
    setAvailableCast([]);

    broadcastProgress(nextMoves, prevActor.name, `Backtracked to ${prevActor.name}`);

    setMoviesLoading(true);
    try {
      const movies = await fetchActorMovies(prevActor.id);
      setAvailableMovies(movies || []);
    } catch (e) {
      setAvailableMovies([]);
    } finally {
      setMoviesLoading(false);
    }
  };

  const handleForfeit = async () => {
    if (!duel?.duelId) return;
    playDefeat();
    if (timerRef.current) clearInterval(timerRef.current);
    const role = myRole || getStoredRole(duel.duelId) || 'HOST';
    try {
      const updated = await submitDuelScore(duel.duelId, {
        playerId: myPlayerId,
        role,
        nickname: customNickname || defaultUsername,
        moves: 99,
        durationSeconds: timerSeconds,
        timeSeconds: timerSeconds,
        forfeited: true,
        pathSummary: 'Forfeited match 🏳️'
      });
      setDuel(updated);
      try {
        saveDetailedMatch(user?.id, {
          id: `duel_${duel.duelId}_${myPlayerId}`,
          gameMode: 'duels',
          subMode: 'duel',
          date: new Date().toISOString().slice(0, 10),
          timestamp: new Date().toISOString(),
          won: false,
          forfeited: true,
          hops: 99,
          optimalHops: duel.optimalHops || null,
          matchedOtara: false,
          durationSeconds: timerSeconds,
          startActor: duel.startActor,
          targetActor: duel.targetActor,
          opponentName: role === 'HOST' ? (duel.guestUsername || 'Opponent') : duel.hostUsername,
          roomCode: duel.duelId,
          duelOutcome: 'FORFEITED'
        });
      } catch (err) {}
    } catch (e) {}
    setPhase('RESULTS');
  };

  const handleInstantRematch = async () => {
    if (!duel?.duelId) return;
    playClick();
    setLoadingAction(true);
    try {
      const role = myRole || getStoredRole(duel.duelId) || 'HOST';
      const nextDuel = await rematchDuel(duel.duelId, { challengeMode: 'RANDOM' });
      if (nextDuel) {
        countdownTriggeredRef.current = null;
        setStoredRole(nextDuel.duelId, role);
        setDuel(nextDuel);
        const url = new URL(window.location.href);
        url.searchParams.set('duel', nextDuel.duelId);
        window.history.replaceState({}, '', url.toString());
        triggerSynchronizedCountdown(nextDuel, role);
      }
    } catch (e) {
      setError('Failed to start rematch.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getInviteUrl = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    if (duel?.duelId) {
      url.searchParams.set('duel', duel.duelId);
    }
    return url.toString();
  };

  const handleCopyInviteLink = () => {
    playClick();
    navigator.clipboard.writeText(getInviteUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!duel?.duelId) return;
    navigator.clipboard.writeText(duel.duelId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleResetToMenu = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('duel');
    window.history.replaceState({}, '', url.toString());
    countdownTriggeredRef.current = null;
    setDuel(null);
    setPhase('MENU');
    setError('');
  };

  const formatTime = (sec) => {
    if (sec === null || sec === undefined) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine my telemetry vs opponent's live telemetry
  const effectiveRole = myRole || getStoredRole(duel?.duelId) || 'HOST';
  const isHost = effectiveRole === 'HOST';

  const myDisplayName = isHost
    ? duel?.hostUsername || customNickname
    : duel?.guestUsername || customNickname;
  const opponentDisplayName = isHost
    ? duel?.guestUsername || 'Challenger'
    : duel?.hostUsername || 'Host';

  const opponentLiveMoves = isHost ? duel?.guestLiveMoves ?? 0 : duel?.hostLiveMoves ?? 0;
  const opponentCurrentActor = isHost
    ? duel?.guestCurrentActor || duel?.startActor?.name
    : duel?.hostCurrentActor || duel?.startActor?.name;
  const opponentLastAction = isHost
    ? duel?.guestLastAction || 'Exploring filmography...'
    : duel?.hostLastAction || 'Exploring filmography...';
  const opponentEmote = isHost ? duel?.guestEmote : duel?.hostEmote;
  const opponentFinishedMoves = isHost ? duel?.guestMoves : duel?.hostMoves;
  const opponentForfeited = isHost ? duel?.guestForfeited : duel?.hostForfeited;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Arena Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-5 sm:p-6 shadow-card">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/15 border border-gold/40 text-gold shadow-gold-glow">
              <Swords className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  <Radio className="h-3 w-3 animate-pulse" />
                  Live 1v1 Online Arena
                </span>
                {duel?.duelId && (
                  <span className="rounded-lg bg-cinema-black/70 border border-cinema-border px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                    Room #{duel.duelId}
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-lg sm:text-xl font-extrabold text-white">
                Beat Otara — Head-to-Head Online Duel
              </h1>
              <p className="text-xs text-cinema-muted">
                Simultaneous 5-second countdown, real-time opponent tracking, and Otara&apos;s Optimal Path reveal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleToggleSound}
              className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-slate-300 hover:border-gold/40 hover:text-gold transition"
              title={muted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {muted ? <VolumeX className="h-3.5 w-3.5 text-slate-400" /> : <Volume2 className="h-3.5 w-3.5 text-gold" />}
              <span className="hidden sm:inline">{muted ? 'Muted' : 'SFX On'}</span>
            </button>

            {phase !== 'MENU' && (
              <button
                onClick={() => {
                  playClick();
                  handleResetToMenu();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-slate-300 hover:border-gold/40 hover:text-gold transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>New Duel Lobby</span>
              </button>
            )}
            <button
              onClick={() => {
                playClick();
                onBackToMain();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-cinema-border bg-cinema-black/60 px-3 py-2 text-xs font-semibold text-cinema-muted hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Solo Beat Otara</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 1: MENU (CREATE RANDOM OR CUSTOM LOBBY / JOIN CODE)              */}
      {/* ===================================================================== */}
      {phase === 'MENU' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Create a 1v1 Duel Lobby */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-gold/30 bg-cinema-card/90 p-6 shadow-card space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-xl bg-gold/15 border border-gold/30 px-3 py-1.5 text-xs font-bold text-gold">
                  <Sparkles className="h-4 w-4" />
                  <span>Host Online 1v1 Lobby</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">
                  ♾️ Unlimited Replayability
                </span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Configure Your 1v1 Matchup
                </h2>
                <p className="mt-1 text-xs text-cinema-muted leading-relaxed">
                  Choose whether to generate a fresh random Hollywood pair or hand-pick the starting and target actors yourself.
                </p>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cinema-muted mb-1.5">
                  Your Display Nickname
                </label>
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  maxLength={20}
                  placeholder="Enter your nickname..."
                  className="w-full rounded-xl border border-cinema-border bg-cinema-black/70 px-3.5 py-2.5 text-sm font-semibold text-white placeholder-cinema-muted focus:border-gold focus:outline-none"
                />
              </div>

              {/* Challenge Mode Selector: Random vs Custom */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cinema-muted mb-2">
                  Challenge Selection Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChallengeType('RANDOM')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                      challengeType === 'RANDOM'
                        ? 'border-gold bg-gold/15 text-white shadow-gold-glow'
                        : 'border-cinema-border bg-cinema-surface/50 text-cinema-muted hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-xs text-gold">
                      <Shuffle className="h-4 w-4" />
                      <span>Random Matchup</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      Generates a fresh random pair of Hollywood stars every single round.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChallengeType('CUSTOM')}
                    className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                      challengeType === 'CUSTOM'
                        ? 'border-gold bg-gold/15 text-white shadow-gold-glow'
                        : 'border-cinema-border bg-cinema-surface/50 text-cinema-muted hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-extrabold text-xs text-gold">
                      <Search className="h-4 w-4" />
                      <span>Custom Actors</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-300">
                      You choose the exact Starting Actor and Target Actor for the duel.
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Actor Picker Controls */}
              {challengeType === 'CUSTOM' && (
                <div className="rounded-xl border border-gold/30 bg-cinema-black/60 p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
                      Select Custom Starting & Target Stars
                    </span>
                    <button
                      type="button"
                      onClick={handleShuffleCustomActors}
                      className="inline-flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-card px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-gold/50 hover:text-gold transition"
                    >
                      <Shuffle className="h-3 w-3" />
                      <span>Randomize Pair</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Starting Actor Dropdown */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-cinema-muted mb-1">
                        Starting Actor
                      </label>
                      <input
                        type="text"
                        value={startSearch}
                        onFocus={() => setStartDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setStartDropdownOpen(false), 180)}
                        onChange={(e) => {
                          setStartSearch(e.target.value);
                          setStartDropdownOpen(true);
                        }}
                        placeholder="Search starting star..."
                        className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-white focus:border-gold focus:outline-none"
                      />
                      {startActorPick && (
                        <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                          <Check className="h-3 w-3 shrink-0" />
                          <span className="truncate">{startActorPick.name}</span>
                        </div>
                      )}
                      {startDropdownOpen && (
                        <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-cinema-border bg-cinema-card shadow-2xl">
                          {filterActors(startSearch).map((actor) => (
                            <button
                              type="button"
                              key={actor.id}
                              onMouseDown={() => {
                                setStartActorPick(actor);
                                setStartSearch(actor.name);
                                setStartDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-200 hover:bg-gold/15 hover:text-gold transition"
                            >
                              <User className="h-3.5 w-3.5 text-cinema-muted shrink-0" />
                              <span className="font-semibold truncate">{actor.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target Actor Dropdown */}
                    <div className="relative">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-cinema-muted mb-1">
                        Target Actor
                      </label>
                      <input
                        type="text"
                        value={targetSearch}
                        onFocus={() => setTargetDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setTargetDropdownOpen(false), 180)}
                        onChange={(e) => {
                          setTargetSearch(e.target.value);
                          setTargetDropdownOpen(true);
                        }}
                        placeholder="Search target star..."
                        className="w-full rounded-xl border border-cinema-border bg-cinema-surface px-3 py-2 text-xs font-semibold text-white focus:border-gold focus:outline-none"
                      />
                      {targetActorPick && (
                        <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-gold/10 border border-gold/30 px-2.5 py-1 text-[11px] font-bold text-gold">
                          <Check className="h-3 w-3 shrink-0" />
                          <span className="truncate">{targetActorPick.name}</span>
                        </div>
                      )}
                      {targetDropdownOpen && (
                        <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-cinema-border bg-cinema-card shadow-2xl">
                          {filterActors(targetSearch).map((actor) => (
                            <button
                              type="button"
                              key={actor.id}
                              onMouseDown={() => {
                                setTargetActorPick(actor);
                                setTargetSearch(actor.name);
                                setTargetDropdownOpen(false);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs text-slate-200 hover:bg-gold/15 hover:text-gold transition"
                            >
                              <User className="h-3.5 w-3.5 text-cinema-muted shrink-0" />
                              <span className="font-semibold truncate">{actor.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCreateLobby}
              disabled={loadingAction}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-5 py-3.5 text-xs sm:text-sm font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition active:scale-98 disabled:opacity-50"
            >
              {loadingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Swords className="h-4 w-4" />
              )}
              <span>
                {challengeType === 'CUSTOM'
                  ? 'Create Custom 1v1 Lobby & Get Link'
                  : 'Create Random 1v1 Lobby & Get Link'}
              </span>
            </button>
          </div>

          {/* Right Column (5 cols): Join Friend's Lobby */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-cinema-border bg-cinema-card/90 p-6 shadow-card space-y-5">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300">
                <Users className="h-4 w-4" />
                <span>Join Friend&apos;s Lobby</span>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">
                  Have a Room Code?
                </h2>
                <p className="mt-1 text-xs text-cinema-muted leading-relaxed">
                  Enter your friend&apos;s 6-character Duel Code below. As soon as you join, the 5-second countdown will begin for both of you simultaneously!
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-cinema-muted mb-1.5">
                  Duel Room Code
                </label>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  placeholder="e.g. A7K9Q2"
                  className="w-full rounded-xl border border-cinema-border bg-cinema-black/70 px-3.5 py-3 text-center font-mono text-base font-extrabold tracking-widest text-gold uppercase placeholder-cinema-muted/50 focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={() => handleLoadOrJoinDuel(joinCodeInput)}
              disabled={loadingAction || !joinCodeInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold/15 px-5 py-3.5 text-xs sm:text-sm font-extrabold text-gold hover:bg-gold hover:text-cinema-black transition active:scale-98 disabled:opacity-40"
            >
              {loadingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              <span>Join Lobby & Start Countdown</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 2: LIVE WAITING ROOM (WAITING FOR OPPONENT TO JOIN)             */}
      {/* ===================================================================== */}
      {phase === 'LOBBY_WAIT' && duel && (
        <div className="rounded-2xl border border-gold/40 bg-cinema-card p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cinema-border pb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
                Lobby Ready • Waiting for Opponent
              </span>
              <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
                Share this link with your friend to start!
              </h2>
              <p className="text-xs text-cinema-muted mt-0.5">
                The 5-second countdown will trigger automatically the instant your friend opens the link or enters the code.
              </p>
            </div>

            {/* Room Code & Copy Link */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-black px-3.5 py-2.5 text-xs font-mono font-bold text-white hover:border-gold/50 transition"
              >
                <span>CODE: {duel.duelId}</span>
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-cinema-muted" />
                )}
              </button>

              <button
                onClick={handleCopyInviteLink}
                className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-extrabold text-cinema-black shadow-gold-glow hover:opacity-90 transition"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                <span>{copiedLink ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
              </button>
            </div>
          </div>

          {/* Matchup Preview */}
          <div className="rounded-2xl border border-cinema-border bg-cinema-surface/70 p-5 text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              {duel.challengeMode === 'CUSTOM' ? '🎯 Custom Selected Matchup' : '🎲 Random Matchup'} • Otara Optimal Benchmark: {duel.optimalMoves || 2} Hops
            </span>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 pt-1">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-emerald-400/60 bg-cinema-surface shadow-md">
                  {duel.startActor?.profilePath ? (
                    <img
                      src={getTmdbImageUrl(duel.startActor.profilePath)}
                      alt={duel.startActor?.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center -z-10 text-cinema-muted bg-cinema-border/40">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                    Start Star
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    {duel.startActor?.name}
                  </span>
                </div>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 border border-gold/40 text-gold font-black text-xs">
                VS
              </div>

              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-gold/60 bg-cinema-surface shadow-md">
                  {duel.targetActor?.profilePath ? (
                    <img
                      src={getTmdbImageUrl(duel.targetActor.profilePath)}
                      alt={duel.targetActor?.name}
                      className="h-full w-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center -z-10 text-cinema-muted bg-cinema-border/40">
                    <User className="h-6 w-6" />
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase tracking-wider text-gold font-bold block">
                    Target Star
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-white">
                    {duel.targetActor?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Players Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 font-bold">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    Player 1 (Host)
                  </span>
                  <span className="text-sm font-extrabold text-white">
                    {duel.hostUsername}
                  </span>
                </div>
              </div>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-extrabold text-emerald-300 uppercase">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-cinema-border bg-cinema-black/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cinema-surface text-gold font-bold">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cinema-muted block">
                    Player 2 (Challenger)
                  </span>
                  <span className="text-sm font-extrabold text-slate-300">
                    Waiting for opponent to join...
                  </span>
                </div>
              </div>
              <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold text-amber-300 uppercase">
                Connecting
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 3: SYNCHRONIZED 5-SECOND COUNTDOWN OVERLAY                      */}
      {/* ===================================================================== */}
      {phase === 'COUNTDOWN' && duel && (
        <div className="relative overflow-hidden rounded-3xl border-2 border-gold bg-gradient-to-b from-cinema-card via-cinema-black to-cinema-card p-8 sm:p-12 text-center shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-gold/5 pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-4 py-1 text-xs font-extrabold uppercase tracking-widest text-emerald-300">
              <Zap className="h-3.5 w-3.5" />
              Both Players Connected • Match Starting!
            </span>

            {/* Head to Head Banner */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                  Host
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {duel.hostUsername}
                </span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold text-cinema-black font-black text-sm shadow-gold-glow">
                VS
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                  Challenger
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {duel.guestUsername || 'Challenger'}
                </span>
              </div>
            </div>

            {/* Giant Countdown Number */}
            <div className="py-4">
              <div className="relative mx-auto flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-3xl border-2 border-gold bg-gold/15 text-5xl sm:text-6xl font-black text-gold shadow-gold-glow animate-pulse">
                <span className="relative z-10">{countdownLeft > 0 ? countdownLeft : 'GO!'}</span>
                <div className="absolute inset-0 rounded-3xl border border-gold/40 animate-ping opacity-30" />
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-300">
                Get Ready to Connect
              </p>
              <p className="mt-1 text-sm sm:text-base font-extrabold text-white">
                {duel.startActor?.name} <span className="text-gold mx-1.5">→</span> {duel.targetActor?.name}
              </p>
            </div>

            {/* Otara Pre-Match Benchmark Briefing */}
            <div className="inline-flex items-center gap-2.5 rounded-2xl border border-gold/40 bg-cinema-black/70 px-4 py-2 text-xs text-amber-200">
              <img
                src="/assets/otara/otara-avatar.png"
                alt="Otara"
                className="h-6 w-6 rounded-full border border-gold/60 bg-gold/20 p-0.5 object-contain"
              />
              <span>
                Otara Benchmark: <strong className="text-gold">{duel.optimalMoves || 2} Hops</strong>. Race to the target in fewest hops!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 4: ACTIVE REAL-TIME ONLINE GAMEPLAY                             */}
      {/* ===================================================================== */}
      {phase === 'PLAYING' && duel && (
        <div className="space-y-5">
          {/* LIVE HEAD-TO-HEAD TELEMETRY HUD */}
          <div className="rounded-2xl border border-gold/40 bg-cinema-card/95 p-4 shadow-xl space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Left (5 cols): YOUR LIVE STATUS */}
              <div className="md:col-span-5 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                      YOU ({myDisplayName})
                    </span>
                    {activeEmote && (
                      <span className="text-base animate-bounce ml-1">{activeEmote}</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold text-white truncate">
                    At: <span className="text-emerald-300">{currentActor?.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[9px] uppercase text-cinema-muted block">Hops</span>
                    <span className="text-sm font-black text-white">{moves}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase text-cinema-muted block">Time</span>
                    <span className="text-sm font-mono font-bold text-gold">
                      {formatTime(timerSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center (2 cols): Otara Referee & Quick Emotes */}
              <div className="md:col-span-2 flex flex-col items-center justify-center gap-1.5">
                <div className="flex items-center gap-1.5 rounded-full bg-cinema-black/80 border border-gold/40 px-2 py-0.5 shadow-sm">
                  <img
                    src="/assets/otara/otara-avatar.png"
                    alt="Otara"
                    className="h-4 w-4 rounded-full object-contain"
                  />
                  <span className="text-[9px] font-black uppercase text-gold">
                    Par {duel.optimalMoves || 2}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {EMOTE_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSendEmote(emoji)}
                      title={`Send ${emoji} to opponent`}
                      className="h-7 w-7 rounded-lg border border-cinema-border bg-cinema-surface hover:border-gold/50 hover:scale-110 transition text-xs flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right (5 cols): OPPONENT'S LIVE TELEMETRY */}
              <div className={`md:col-span-5 flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-300 ${
                opponentFlash
                  ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.01]'
                  : 'border-indigo-500/40 bg-indigo-500/10'
              }`}>
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${opponentFlash ? 'bg-amber-400 animate-ping' : 'bg-indigo-400 animate-pulse'}`} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 truncate">
                      OPPONENT ({opponentDisplayName})
                    </span>
                    {opponentFlash && (
                      <span className="animate-bounce inline-flex items-center rounded bg-amber-400 text-cinema-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                        +1 HOP!
                      </span>
                    )}
                    {opponentEmote && (
                      <span className="text-base animate-bounce ml-1" title="Opponent reaction">
                        {opponentEmote}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold text-white truncate">
                    {opponentFinishedMoves !== null && opponentFinishedMoves !== undefined ? (
                      opponentForfeited ? (
                        <span className="text-rose-400">🏳️ Forfeited match</span>
                      ) : (
                        <span className="text-gold">
                          🏆 Finished in {opponentFinishedMoves} hops!
                        </span>
                      )
                    ) : (
                      <>
                        At: <span className="text-indigo-300">{opponentCurrentActor}</span>
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-cinema-muted truncate mt-0.5">
                    {opponentLastAction}
                  </p>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[9px] uppercase text-cinema-muted block">Opp Hops</span>
                  <span className={`text-base font-black ${opponentFlash ? 'text-amber-400 scale-110' : 'text-indigo-300'} transition-transform`}>
                    {opponentFinishedMoves !== null && opponentFinishedMoves !== undefined
                      ? opponentForfeited
                        ? '🏳️'
                        : opponentFinishedMoves
                      : opponentLiveMoves}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time Comparative Race Indicator */}
            <div className="rounded-xl border border-cinema-border/60 bg-cinema-black/40 px-3.5 py-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                <span className="text-emerald-400 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  You: {moves} {moves === 1 ? 'Hop' : 'Hops'}
                </span>
                <span className="text-gold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Otara Par: {duel.optimalMoves || 2}
                </span>
                <span className="text-indigo-300 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {opponentDisplayName}: {opponentLiveMoves} {opponentLiveMoves === 1 ? 'Hop' : 'Hops'}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-cinema-surface/80 border border-cinema-border/40">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(50, (moves / Math.max(1, (duel.optimalMoves || 2) * 2)) * 50)}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 bg-indigo-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(50, (opponentLiveMoves / Math.max(1, (duel.optimalMoves || 2) * 2)) * 50)}%` }}
                />
                {/* Center Otara Par Line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-gold shadow-[0_0_8px_rgba(230,175,46,0.9)]" />
              </div>
            </div>

            {/* Target Bar + Action Controls (Undo / Forfeit) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cinema-border/60 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="text-cinema-muted">Goal:</span>
                <span className="font-bold text-emerald-400">{duel.startActor?.name}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold" />
                <span className="font-bold text-gold">{duel.targetActor?.name}</span>
                <span className="hidden sm:inline text-[11px] text-cinema-muted">
                  (Otara Benchmark: {duel.optimalMoves || 2} hops)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={chain.length <= 1}
                  className="flex items-center gap-1 rounded-lg border border-cinema-border bg-cinema-surface px-2.5 py-1 text-xs font-semibold text-slate-200 hover:border-gold/50 disabled:opacity-40 transition"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  <span>Undo Step</span>
                </button>

                <button
                  onClick={handleForfeit}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Give Up</span>
                </button>
              </div>
            </div>
          </div>

          <VisualGraph
            chain={chain}
            targetActor={duel.targetActor}
            onStepClick={() => {}}
          />

          <ChainBuilder
            currentActor={currentActor}
            selectedMovie={selectedMovie}
            availableMovies={availableMovies}
            availableCast={availableCast}
            moviesLoading={moviesLoading}
            castLoading={castLoading}
            targetActor={duel.targetActor}
            onSelectMovie={handleSelectMovie}
            onClearMovie={() => setSelectedMovie(null)}
            onSelectActor={handleSelectActor}
            onUndo={handleUndo}
            canUndo={chain.length > 1}
            previousActor={chain.length > 1 ? chain[chain.length - 2].actor : null}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* PHASE 5: POST-MATCH RESULTS + OTARA'S OPTIMAL ROUTE + REMATCH         */}
      {/* ===================================================================== */}
      {phase === 'RESULTS' && duel && (() => {
        const duelResult = computeDuelWinner(duel);
        return (
          <div className="rounded-2xl border border-gold/40 bg-cinema-card p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            {rematchAlert && (
              <div className="rounded-2xl border-2 border-gold bg-gradient-to-r from-gold/25 via-amber-500/20 to-gold/25 p-4 text-center shadow-gold-glow animate-pulse">
                <span className="text-sm font-extrabold text-gold flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                  {rematchAlert}
                </span>
              </div>
            )}

            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 border border-gold/40 text-gold shadow-gold-glow">
                <Trophy className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-gold block">
                {duelResult.isCompleted ? '1v1 Match Completed' : 'Waiting for Opponent to Finish...'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {duelResult.title}
              </h2>
              {duelResult.subtitle && (
                <p className="text-xs text-cinema-muted">
                  {duelResult.subtitle}
                </p>
              )}
              <p className="text-xs text-cinema-muted">
                {duel.startActor?.name} → {duel.targetActor?.name}
              </p>
            </div>

          {/* Head-to-Head Scoreboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Host Card */}
            <div
              className={`rounded-2xl border p-5 space-y-3 ${
                duelResult.isCompleted && duelResult.winnerRole === 'HOST'
                  ? 'border-gold bg-gold/10 shadow-gold-glow'
                  : 'border-cinema-border bg-cinema-surface/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cinema-muted block">
                    Player 1 (Host)
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {duel.hostUsername}
                  </span>
                </div>
                {duelResult.isCompleted && duelResult.winnerRole === 'HOST' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-extrabold text-cinema-black uppercase">
                    <Crown className="h-3 w-3" /> Winner
                  </span>
                )}
              </div>

              {duel.hostMoves !== null && duel.hostMoves !== undefined ? (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl bg-cinema-black/60 p-3">
                      <span className="text-[10px] text-cinema-muted block">Hops</span>
                      <span className="text-lg font-extrabold text-white">
                        {duel.hostForfeited ? '🏳️ Forfeit' : `${duel.hostMoves} moves`}
                      </span>
                    </div>
                    <div className="rounded-xl bg-cinema-black/60 p-3">
                      <span className="text-[10px] text-cinema-muted block">Time</span>
                      <span className="text-lg font-mono font-extrabold text-gold">
                        {formatTime(duel.hostDurationSeconds ?? duel.hostTimeSeconds)}
                      </span>
                    </div>
                  </div>
                  {duel.hostPathSummary && (
                    <div className="rounded-xl border border-cinema-border/60 bg-cinema-black/40 p-2.5 text-[11px] text-slate-300">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cinema-muted block mb-1">
                        Host&apos;s Path:
                      </span>
                      <p className="leading-relaxed">{duel.hostPathSummary}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="flex items-center gap-2 text-xs text-gold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Playing Live: {duel.hostLiveMoves || 0} hops (At: {duel.hostCurrentActor || duel.startActor?.name})
                    </span>
                  </div>
                  {duel.hostLastAction && (
                    <p className="text-[11px] text-cinema-muted">{duel.hostLastAction}</p>
                  )}
                </div>
              )}
            </div>

            {/* Challenger Card */}
            <div
              className={`rounded-2xl border p-5 space-y-3 ${
                duelResult.isCompleted && duelResult.winnerRole === 'GUEST'
                  ? 'border-gold bg-gold/10 shadow-gold-glow'
                  : 'border-cinema-border bg-cinema-surface/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cinema-muted block">
                    Player 2 (Challenger)
                  </span>
                  <span className="text-base font-extrabold text-white">
                    {duel.guestUsername || 'Waiting for friend...'}
                  </span>
                </div>
                {duelResult.isCompleted && duelResult.winnerRole === 'GUEST' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[10px] font-extrabold text-cinema-black uppercase">
                    <Crown className="h-3 w-3" /> Winner
                  </span>
                )}
              </div>

              {duel.guestMoves !== null && duel.guestMoves !== undefined ? (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl bg-cinema-black/60 p-3">
                      <span className="text-[10px] text-cinema-muted block">Hops</span>
                      <span className="text-lg font-extrabold text-white">
                        {duel.guestForfeited ? '🏳️ Forfeit' : `${duel.guestMoves} moves`}
                      </span>
                    </div>
                    <div className="rounded-xl bg-cinema-black/60 p-3">
                      <span className="text-[10px] text-cinema-muted block">Time</span>
                      <span className="text-lg font-mono font-extrabold text-gold">
                        {formatTime(duel.guestDurationSeconds ?? duel.guestTimeSeconds)}
                      </span>
                    </div>
                  </div>
                  {duel.guestPathSummary && (
                    <div className="rounded-xl border border-cinema-border/60 bg-cinema-black/40 p-2.5 text-[11px] text-slate-300">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-cinema-muted block mb-1">
                        Challenger&apos;s Path:
                      </span>
                      <p className="leading-relaxed">{duel.guestPathSummary}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="flex items-center gap-2 text-xs text-indigo-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      Playing Live: {duel.guestLiveMoves || 0} hops (At: {duel.guestCurrentActor || duel.startActor?.name})
                    </span>
                  </div>
                  {duel.guestLastAction && (
                    <p className="text-[11px] text-cinema-muted">{duel.guestLastAction}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* OTARA'S OPTIMAL SHORTEST PATH REVEAL                              */}
          {/* ================================================================= */}
          <div className="rounded-2xl border border-gold/40 bg-gradient-to-r from-cinema-surface via-cinema-black/80 to-cinema-surface p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/otara/otara-impressed.png"
                  alt="Otara"
                  className="h-12 w-12 rounded-xl object-contain bg-gold/10 border border-gold/40 p-1"
                />
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold block">
                    Oracle Masterclass
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-white">
                    Otara&apos;s Optimal Shortest Route ({optimalPath?.length || duel.optimalMoves || 2} Hops)
                  </h3>
                </div>
              </div>
              <span className="rounded-lg bg-gold/15 border border-gold/30 px-2.5 py-1 text-[10px] font-bold text-gold">
                Shortest Possible Hollywood Chain
              </span>
            </div>

            {optimalLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-cinema-muted">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                <span>Revealing Otara&apos;s shortest route...</span>
              </div>
            ) : optimalPath && optimalPath.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {optimalPath.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs flex-wrap sm:flex-nowrap rounded-xl border border-cinema-border/70 bg-cinema-card/70 px-3.5 py-2.5"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold/20 text-[10px] font-black text-gold shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <User className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{step.actor?.name}</span>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-cinema-muted shrink-0" />

                    <div className="flex items-center gap-1.5 rounded-lg bg-gold/15 px-2.5 py-1 text-gold border border-gold/30 font-bold">
                      <Film className="h-3.5 w-3.5 shrink-0" />
                      <span>{step.movie?.title}</span>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-cinema-muted shrink-0" />

                    <div className="flex items-center gap-1.5 font-extrabold text-white">
                      <User className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span>{step.nextActor?.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-cinema-muted">
                Optimal benchmark between {duel.startActor?.name} and {duel.targetActor?.name} is {duel.optimalMoves || 2} hops.
              </p>
            )}
          </div>

          {/* Rematch & Share Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleInstantRematch}
              disabled={loadingAction}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-xs sm:text-sm font-extrabold text-cinema-black shadow-gold-glow hover:opacity-95 transition active:scale-95"
            >
              {loadingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Instant Rematch (New Random Pair)</span>
            </button>

            <button
              onClick={handleResetToMenu}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface px-5 py-3 text-xs font-bold text-slate-200 hover:border-gold/50 hover:text-gold transition"
            >
              <Search className="h-4 w-4" />
              <span>New Custom Lobby</span>
            </button>

            <button
              onClick={handleCopyInviteLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-cinema-border bg-cinema-black/60 px-4 py-3 text-xs font-semibold text-cinema-muted hover:text-white transition"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Duel Link'}</span>
            </button>
          </div>
        </div>
      );
    })()}
    </div>
  );
}
