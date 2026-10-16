import React, { useState, useEffect, useRef } from 'react';

/**
 * OtaraObservingMascot:
 * Interactive 2D cartoon mascot with dynamic eye-tracking pupils and natural blinking.
 * During active gameplay, Otara sits attentively with hand on chin,
 * watching the user's cursor as they browse movies and choose routes.
 */
export default function OtaraObservingMascot({
  moves = 0,
  optimalHops = 3,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
}) {
  const containerRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const lastMouseMoveRef = useRef(Date.now());
  const rafRef = useRef(null);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });

  // 1. Mouse Tracking with Smooth LERP
  useEffect(() => {
    const handleMouseMove = (e) => {
      lastMouseMoveRef.current = Date.now();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      // Estimated position of Otara's eyes on screen
      const eyesX = rect.left + rect.width * 0.49;
      const eyesY = rect.top + rect.height * 0.21;

      const dx = e.clientX - eyesX;
      const dy = e.clientY - eyesY;
      const dist = Math.hypot(dx, dy);

      // Max eye travel limit (px)
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

    // Smooth animation loop for eye position
    const animate = () => {
      const now = Date.now();
      const timeSinceMouse = now - lastMouseMoveRef.current;

      // If idle for more than 2 seconds, perform autonomous scanning
      if (timeSinceMouse > 2000) {
        const t = (now - lastMouseMoveRef.current - 2000) / 1000;
        // Subtle scan: look slightly down-left at the path, then center, then right
        const scanX = Math.sin(t * 1.5) * 2.5;
        const scanY = 1.2 + Math.cos(t * 1.2) * 1.0;
        targetOffsetRef.current = { x: scanX, y: scanY };
      }

      // LERP toward target
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
  }, []);

  // 2. Natural Random Blinking
  useEffect(() => {
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
  }, []);

  // Size configurations
  const sizeClasses = {
    sm: 'w-24 h-27',
    md: 'w-32 sm:w-40 h-36 sm:h-44',
    lg: 'w-44 sm:w-52 h-48 sm:h-58',
  };

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
