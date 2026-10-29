/**
 * Lightweight Web Audio API Sound Synthesizer for ReelQuest
 * 
 * Provides crisp, subtle, and cinematic audio feedback without requiring external audio asset files.
 * Zero network delay, zero 404s, and tuned with soft harmonic envelopes so it never fatigues the player's ears.
 * 
 * State persists in localStorage under 'reelquest_sfx_muted'.
 */

let audioCtx = null;
let isMuted = false;

// Initialize mute state from localStorage
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('reelquest_sfx_muted');
    isMuted = stored === 'true';
  }
} catch (e) {
  isMuted = false;
}

const listeners = new Set();

/**
 * Lazily creates or resumes the Web Audio context.
 * Modern browsers require a user gesture before playing sound.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted() {
  return isMuted;
}

export function setSoundMuted(muted) {
  isMuted = Boolean(muted);
  try {
    localStorage.setItem('reelquest_sfx_muted', isMuted ? 'true' : 'false');
  } catch (e) {}
  listeners.forEach((fn) => {
    try {
      fn(isMuted);
    } catch (e) {}
  });
}

export function toggleSound() {
  const next = !isMuted;
  setSoundMuted(next);
  if (!next) {
    playClick();
  }
  return next;
}

export function subscribeSoundMuted(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * 1. playClick: Crisp, subtle acoustic tick for button clicks and menu options
 */
export function playClick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.025);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (e) {}
}

/**
 * 2. playNodeConnect: Warm, cinematic harmonic chime when connecting an actor or movie node
 */
export function playNodeConnect() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonious chord notes: E5 (659Hz) and G#5 (830Hz)
    const freqs = [659.25, 830.61];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.05, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.25);
    });
  } catch (e) {}
}

/**
 * 3. playCountdownTick: Punchy wooden tick for 5..2, golden rising chime for 1 / GO!
 */
export function playCountdownTick(isFinal = false) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (isFinal) {
      // Golden dual-tone chime for match start (D5 -> A5)
      [587.33, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startT = now + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startT);

        gain.gain.setValueAtTime(0.08, startT);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startT);
        osc.stop(startT + 0.38);
      });
    } else {
      // Clean wood-block percussive tick for 5, 4, 3, 2
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.045);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (e) {}
}

/**
 * 4. playOpponentMove: Soft, non-intrusive radar blip when the opponent makes a move in 1v1
 */
export function playOpponentMove() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
}

/**
 * 5. playHintWhisper: Gentle arpeggiated sparkle sweep when consulting Otara's oracle hint
 */
export function playHintWhisper() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.04, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.32);
    });
  } catch (e) {}
}

/**
 * 6. playVictory: Uplifting cinematic fanfare chord progression
 */
export function playVictory() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // C major arpeggio: C5, E5, G5, C6
    const chord = [523.25, 659.25, 783.99, 1046.5];

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.065;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.06, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.55);
    });
  } catch (e) {}
}

/**
 * 7. playDefeat: Sympathetic, soft minor cadence (A4 -> E4)
 */
export function playDefeat() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [440, 392, 329.63]; // A4, G4, E4

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startT = now + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.04, startT);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.3);
    });
  } catch (e) {}
}

/**
 * 8. playEmote: Friendly pop/bubble sound when receiving or sending an emote
 */
export function playEmote() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.07);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}
