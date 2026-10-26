import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, Lightbulb, HeartHandshake } from 'lucide-react';

/**
 * OtaraObservingMascot:
 * Interactive 2D cartoon mascot with dynamic emotions and eye-tracking pupils.
 * 
 * Emotions:
 * - 'OBSERVING': Default active gameplay. Sits attentively with hand on chin,
 *   watching the user's cursor with dynamic pupil tracking and natural blinking.
 * - 'IMPRESSED': Triggered on optimal/ideal moves or benchmark par. Thumbs up and bright smile!
 * - 'ENCOURAGING': Triggered on detours, mistakes, or undos. Supportive open pose.
 * - 'HINT': Triggered when player opens Otara's oracle hint. Mystical glowing stance.
 * - 'VICTORY': Celebration stance upon completing the chain.
 * 
 * Core visual appearance strictly preserved using official mascot assets.
 */
export default function OtaraObservingMascot({
  moves = 0,
  optimalHops = 3,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  emotion = 'OBSERVING', // 'OBSERVING' | 'IMPRESSED' | 'ENCOURAGING' | 'HINT' | 'VICTORY'
  showBadge = false,
}) {
  const containerRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const lastMouseMoveRef = useRef(Date.now());
  const rafRef = useRef(null);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });

  // 1. Mouse Tracking with Smooth LERP (only when in OBSERVING emotion)
  useEffect(() => {
    if (emotion !== 'OBSERVING') return;

    const handleMouseMove = (e) => {
      lastMouseMoveRef.current = Date.now();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const eyesX = rect.left + rect.width * 0.49;
      const eyesY = rect.top + rect.height * 0.21;

      const dx = e.clientX - eyesX;
      const dy = e.clientY - eyesY;
      const dist = Math.hypot(dx, dy);

      const maxDistX = 3.8;
      const maxDistY = 2.4;
      const pull = Math.min(1, dist / 350);

      if (dist > 0) {
        targetOffsetRef.current = {
          x: (dx / dist) * maxDistX * pull,
          y: (dy / dist) * maxDistY * pull,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      const now = Date.now();
      const timeSinceMouse = now - lastMouseMoveRef.current;

      // Autonomous idle scanning
      if (timeSinceMouse > 2000) {
        const t = (now - lastMouseMoveRef.current - 2000) / 1000;
        const scanX = Math.sin(t * 1.5) * 2.5;
        const scanY = 1.2 + Math.cos(t * 1.2) * 1.0;
        targetOffsetRef.current = { x: scanX, y: scanY };
      }

      const lerpFactor = 0.12;
      currentOffsetRef.current.x += (targetOffsetRef.current.x - currentOffsetRef.current.x) * lerpFactor;
      currentOffsetRef.current.y += (targetOffsetRef.current.y - currentOffsetRef.current.y) * lerpFactor;

      setPupilOffset({
        x: Number(currentOffsetRef.current.x.toFixed(2)),
        y: Number(currentOffsetRef.current.y.toFixed(2)),
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [emotion]);

  // 2. Natural Random Blinking (only when in OBSERVING emotion)
  useEffect(() => {
    if (emotion !== 'OBSERVING') return;

    let blinkTimeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 130);

      const nextDelay = 3500 + Math.random() * 3500;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, [emotion]);

  // Size configurations
  const sizeClasses = {
    sm: 'w-24 h-27',
    md: 'w-32 sm:w-40 h-36 sm:h-44',
    lg: 'w-44 sm:w-52 h-48 sm:h-58',
  };

  // Render Alternate Emotional Poses (Impressed, Encouraging, Hint, Victory)
  if (emotion === 'IMPRESSED' || emotion === 'VICTORY') {
    return (
      <div
        ref={containerRef}
        className={`relative select-none pointer-events-none animate-otara-pop ${sizeClasses[size] || sizeClasses.md} ${className}`}
      >
        <img
          src="/assets/otara/otara-impressed.png"
          alt="Otara is Impressed"
          className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_22px_rgba(230,175,46,0.45)]"
        />
        {showBadge && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[9px] font-black uppercase text-cinema-black shadow-lg">
            <Sparkles className="h-2.5 w-2.5 fill-cinema-black" />
            <span>Optimal Pace</span>
          </div>
        )}
      </div>
    );
  }

  if (emotion === 'ENCOURAGING') {
    return (
      <div
        ref={containerRef}
        className={`relative select-none pointer-events-none animate-otara-pop ${sizeClasses[size] || sizeClasses.md} ${className}`}
      >
        <img
          src="/assets/otara/otara-encouraging.png"
          alt="Otara is Encouraging"
          className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_16px_rgba(59,130,246,0.3)]"
        />
        {showBadge && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-indigo-600/90 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-lg">
            <HeartHandshake className="h-2.5 w-2.5" />
            <span>Keep Going</span>
          </div>
        )}
      </div>
    );
  }

  if (emotion === 'HINT') {
    return (
      <div
        ref={containerRef}
        className={`relative select-none pointer-events-none animate-otara-glow ${sizeClasses[size] || sizeClasses.md} ${className}`}
      >
        <img
          src="/assets/otara/otara-challenge.png"
          alt="Otara Oracle Hint"
          className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_28px_rgba(230,175,46,0.6)]"
        />
        {showBadge && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[9px] font-black uppercase text-cinema-black shadow-lg">
            <Lightbulb className="h-2.5 w-2.5 fill-cinema-black" />
            <span>Oracle Clue</span>
          </div>
        )}
      </div>
    );
  }

  // Default: OBSERVING with live eye-tracking pupils & natural blinking
  return (
    <div
      ref={containerRef}
      className={`relative select-none pointer-events-none ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {/* Base Otara cutout with clean white sclera */}
      <img
        src="/assets/otara/otara-observing-blank.png"
        alt="Otara is Observing"
        className="h-full w-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] drop-shadow-[0_0_18px_rgba(230,175,46,0.2)]"
      />

      {/* LEFT EYE CONTAINER (Viewer's Left) */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '20.6%',
          left: '42.2%',
          width: '5.2%',
          height: '2.5%',
          borderRadius: '45% 55% 45% 45% / 50% 60% 40% 50%',
        }}
      >
        {/* Dynamic Pupil */}
        <img
          src="/assets/otara/otara-pupil.png"
          alt=""
          className="absolute w-[68%] h-[110%] object-contain"
          style={{
            top: '0%',
            left: '16%',
            transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
            transition: 'transform 0.04s ease-out',
          }}
        />

        {/* Eyelid Blink Overlay */}
        <div
          className="absolute inset-0 bg-[#cfa182] border-b border-[#3d271e] transition-all duration-75"
          style={{
            transform: isBlinking ? 'translateY(0%)' : 'translateY(-110%)',
          }}
        />
      </div>

      {/* RIGHT EYE CONTAINER (Viewer's Right) */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: '20.5%',
          left: '55.0%',
          width: '5.2%',
          height: '2.5%',
          borderRadius: '55% 45% 45% 45% / 60% 50% 50% 40%',
        }}
      >
        {/* Dynamic Pupil */}
        <img
          src="/assets/otara/otara-pupil.png"
          alt=""
          className="absolute w-[68%] h-[110%] object-contain"
          style={{
            top: '0%',
            left: '16%',
            transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
            transition: 'transform 0.04s ease-out',
          }}
        />

        {/* Eyelid Blink Overlay */}
        <div
          className="absolute inset-0 bg-[#cfa182] border-b border-[#3d271e] transition-all duration-75"
          style={{
            transform: isBlinking ? 'translateY(0%)' : 'translateY(-110%)',
          }}
        />
      </div>
    </div>
  );
}
