import React, { useState, useEffect, useRef } from 'react';
import { Play, Sparkles, Trophy, Footprints, Clock, ArrowRight, ShieldCheck, HelpCircle, Swords, Lightbulb } from 'lucide-react';
import { getTmdbImageUrl } from '../api/client';
import OtaraObservingMascot from './OtaraObservingMascot';
import { playClick, playHintWhisper, playNodeConnect } from '../utils/soundEffects';

export function OtaraChallengeCard({
  challenge,
  gameStatus,
  moves = 0,
  timerSeconds = 0,
  onStart,
  onOpenSummary,
  onOpenDuel,
  onOpenHint
}) {
  const [activeEmotion, setActiveEmotion] = useState('OBSERVING');
  const prevMovesRef = useRef(moves);
  const emotionTimerRef = useRef(null);

  if (!challenge) return null;

  const optimalHops = challenge.optimalHops || 2;
  const isReady = gameStatus === 'READY';
  const isPlaying = gameStatus === 'PLAYING';
  const isWon = gameStatus === 'WON';
  const isGaveUp = gameStatus === 'GAVE_UP';
  const isFinished = isWon || isGaveUp;
  const matchedOtara = isWon && moves <= optimalHops;

  // React dynamically to player moves during active gameplay
  useEffect(() => {
    if (!isPlaying) return;

    if (moves > prevMovesRef.current && prevMovesRef.current !== 0) {
      if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);

      if (moves <= optimalHops) {
        // Ideal/Optimal move: Otara is impressed!
        setActiveEmotion('IMPRESSED');
        emotionTimerRef.current = setTimeout(() => {
          setActiveEmotion('OBSERVING');
        }, 3200);
      } else {
        // Detour move: Otara is encouraging!
        setActiveEmotion('ENCOURAGING');
        emotionTimerRef.current = setTimeout(() => {
          setActiveEmotion('OBSERVING');
        }, 3200);
      }
    }
    prevMovesRef.current = moves;

    return () => {
      if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    };
  }, [moves, optimalHops, isPlaying]);

  const handleStartClick = () => {
    playClick();
    if (onStart) onStart();
  };

  const handleDuelClick = () => {
    playClick();
    if (onOpenDuel) onOpenDuel();
  };

  const handleHintClick = () => {
    playHintWhisper();
    setActiveEmotion('HINT');
    if (emotionTimerRef.current) clearTimeout(emotionTimerRef.current);
    emotionTimerRef.current = setTimeout(() => {
      setActiveEmotion('OBSERVING');
    }, 4000);
    if (onOpenHint) onOpenHint();
  };

  // Pre-Game Ready Screen
  if (isReady) {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-gold/60 bg-gradient-to-b from-cinema-card via-cinema-surface to-cinema-card p-5 sm:p-8 shadow-2xl animate-fade-in">
        {/* Glow ambient effects */}
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Otara Character Animated Art (Full-body Natural Cutout) */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="relative h-60 w-36 sm:h-72 sm:w-44 transition-transform hover:scale-105 animate-otara-float">
              <img
                src="/assets/otara/otara-challenge.png"
                alt="Otara - Cinema Oracle"
                className="h-full w-full object-contain filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.9)] drop-shadow-[0_0_24px_rgba(230,175,46,0.25)] transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="-mt-2 rounded-xl bg-cinema-black/90 backdrop-blur-md px-3 py-1 border border-gold/40 text-center shadow-xl z-10">
              <span className="text-[11px] font-black uppercase tracking-wider text-gold flex items-center justify-center gap-1">
                <Sparkles className="h-3 w-3 fill-gold animate-pulse" />
                Otara
              </span>
              <span className="text-[9px] text-cinema-muted block">The Cinema Oracle</span>
            </div>
          </div>

          {/* Dialog & Challenge Briefing */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            {/* Speech bubble */}
            <div className="relative rounded-2xl border border-gold/40 bg-cinema-black/60 p-4 sm:p-5 shadow-inner">
              <div className="flex items-center gap-2 mb-1 justify-center lg:justify-start">
                <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-gold border border-gold/40">
                  Otara's Challenge
                </span>
                <span className="text-xs text-cinema-muted">Daily Hollywood Duel</span>
              </div>

              <h2 className="text-base sm:text-xl font-extrabold text-white leading-snug">
                "I already found the shortest route in exactly <span className="text-gold underline decoration-gold/60 underline-offset-4">{optimalHops} hops</span>!"
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
                Can you match my cinema prowess? Connect <strong className="text-white">{challenge.startActor?.name}</strong> to <strong className="text-white">{challenge.targetActor?.name}</strong> in the fewest film hops.
              </p>
            </div>

            {/* Target Actor Matchup Pill */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl border border-cinema-border bg-cinema-surface/80 px-3 py-1.5 text-xs text-slate-200">
                <span className="text-[10px] uppercase font-bold text-cinema-muted">Start:</span>
                <span className="font-bold text-white">{challenge.startActor?.name}</span>
              </div>

              <ArrowRight className="h-4 w-4 text-gold shrink-0 hidden sm:block" />

              <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-gold">
                <span className="text-[10px] uppercase font-bold text-gold/80">Target:</span>
                <span className="font-extrabold text-white">{challenge.targetActor?.name}</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Otara's Par: {optimalHops} Hops</span>
              </div>
            </div>

            {/* Big Start Button + 1v1 Online Duel Button */}
            <div className="pt-2">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={handleStartClick}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold-dark px-8 py-3.5 text-sm sm:text-base font-extrabold text-cinema-black shadow-gold-glow transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Play className="h-5 w-5 fill-cinema-black transition-transform group-hover:scale-110" />
                  <span>Start Challenge</span>
                </button>

                {onOpenDuel && (
                  <button
                    onClick={handleDuelClick}
                    className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-gold/60 bg-cinema-black/80 px-6 py-3.5 text-sm sm:text-base font-extrabold text-gold shadow-lg transition-all duration-300 hover:bg-gold/15 hover:border-gold hover:scale-105 active:scale-95"
                  >
                    <Swords className="h-5 w-5 text-gold transition-transform group-hover:rotate-12" />
                    <span>1v1 Online Duel</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-cinema-muted">
                Play today's solo challenge or challenge a friend live in a 1v1 online duel!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished State: Otara reacts to user's result (Praise or Encouragement)
  if (isFinished) {
    const isImpressed = matchedOtara;
    const mascotImg = isImpressed ? '/assets/otara/otara-impressed.png' : '/assets/otara/otara-encouraging.png';

    return (
      <div className={`relative overflow-hidden rounded-2xl border ${isImpressed ? 'border-gold bg-gradient-to-r from-gold/20 via-cinema-card to-cinema-surface' : 'border-cinema-border bg-cinema-card/90'} p-4 sm:p-5 shadow-xl animate-fade-in`}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="relative h-28 w-24 sm:h-32 sm:w-28 shrink-0 animate-otara-float">
            <img
              src={mascotImg}
              alt="Otara Reaction"
              className="h-full w-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[10px] font-black uppercase tracking-wider text-gold flex items-center gap-1">
                <Sparkles className="h-3 w-3 fill-gold animate-pulse" />
                {isImpressed ? '🌟 Otara is Impressed!' : "🤝 Otara's Verdict"}
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {isImpressed
                ? `"Brilliant! You matched my optimal route in ${moves} hops! A true cinephile!"`
                : isWon
                  ? `"Well played! You reached the target in ${moves} hops! I found a shorter path in ${optimalHops} hops, but great effort!"`
                  : `"No worries! Even master directors need a second take. Here is my optimal path:"`}
            </h3>

            <p className="text-xs text-cinema-muted">
              Your Hops: <strong className="text-white">{moves}</strong> | Otara's Par: <strong className="text-gold">{optimalHops} Hops</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onOpenDuel && (
              <button
                onClick={handleDuelClick}
                className="flex items-center gap-1.5 rounded-xl border border-gold/40 bg-cinema-black/60 px-3.5 py-2 text-xs font-bold text-gold hover:bg-gold/15 transition active:scale-95"
              >
                <Swords className="h-4 w-4" />
                <span>1v1 Duel</span>
              </button>
            )}
            {onOpenSummary && (
              <button
                onClick={() => {
                  playClick();
                  onOpenSummary();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/15 px-3.5 py-2 text-xs font-bold text-gold hover:bg-gold hover:text-cinema-black transition active:scale-95 shadow-sm"
              >
                <Trophy className="h-4 w-4" />
                <span>View Results</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Gameplay HUD: Otara is observing the player live with dynamic emotions & animated eye tracking!
  const getCommentaryText = () => {
    if (activeEmotion === 'IMPRESSED') {
      return `„Spot on! Right on the golden par pace! One step closer to cinema glory.“`;
    }
    if (activeEmotion === 'ENCOURAGING') {
      return `„A scenic detour, but the connection is still alive. Search for a direct co-star!“`;
    }
    if (activeEmotion === 'HINT') {
      return `„Otara's Oracle Whisper: Look for celebrated blockbusters where both stars shared the marquee!“`;
    }
    if (moves === 0) {
      return `„I already found the route in ${optimalHops} hops. Select your opening film...“`;
    }
    if (moves < optimalHops) {
      return `„Looking sharp! You're at ${moves} hops, right on pace with my calculation.“`;
    }
    if (moves === optimalHops) {
      return `„Tense moment! One direct connection will tie my record!“`;
    }
    return `„You took a scenic detour, but keep pushing forward. Bridge the gap!“`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-cinema-border/80 bg-gradient-to-r from-cinema-card via-cinema-surface to-cinema-card p-3 sm:p-4 shadow-xl backdrop-blur-md">
      {/* Subtle ambient light */}
      <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Dynamic Emotional Otara Mascot */}
        <div className="relative shrink-0 flex items-center justify-center">
          <OtaraObservingMascot
            moves={moves}
            optimalHops={optimalHops}
            size="md"
            emotion={activeEmotion}
            showBadge={activeEmotion !== 'OBSERVING'}
          />
          {activeEmotion === 'OBSERVING' && (
            <div className="absolute bottom-1 right-2 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-cinema-black"></span>
            </div>
          )}
        </div>

        {/* Dynamic commentary speech bubble */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold fill-gold" />
              {activeEmotion === 'IMPRESSED' ? (
                <span className="text-gold">Otara is Impressed!</span>
              ) : activeEmotion === 'ENCOURAGING' ? (
                <span className="text-indigo-300">Otara is Cheering!</span>
              ) : activeEmotion === 'HINT' ? (
                <span className="text-amber-400">Oracle Hint Active</span>
              ) : (
                'Otara is Watching'
              )}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-wider border ${
              activeEmotion === 'IMPRESSED'
                ? 'bg-gold/20 border-gold/40 text-gold'
                : activeEmotion === 'ENCOURAGING'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
            }`}>
              {activeEmotion === 'OBSERVING' ? 'LIVE EYE TRACKING' : activeEmotion}
            </span>
            <span className="hidden sm:inline-block rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[9px] font-bold text-gold">
              ORACLE
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-snug">
            {getCommentaryText()}
          </p>

          <div className="pt-1 flex items-center justify-between gap-3 text-[11px] text-cinema-muted">
            <div className="flex items-center gap-3">
              <span>
                Your Hops: <strong className="text-white">{moves}</strong>
              </span>
              <span>•</span>
              <span>
                Otara&apos;s Par: <strong className="text-gold font-bold">{optimalHops} Hops</strong>
              </span>
            </div>

            {onOpenHint && (
              <button
                onClick={handleHintClick}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gold/50 bg-gold/15 px-3 py-1 text-xs font-black text-gold hover:bg-gold hover:text-cinema-black shadow-gold-glow transition active:scale-95"
                title="Ask Otara for a Cinephile Hint"
              >
                <Lightbulb className="h-3.5 w-3.5 fill-gold hover:fill-current" />
                <span>Ask Otara for a Hint</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
