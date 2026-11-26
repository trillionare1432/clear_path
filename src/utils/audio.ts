/**
 * Gentle Web Audio Synthesizer for ClearPath AI Cognitive Games
 * Produces soft, calm sinusoidal tones and peaceful chimes without external audio assets.
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

export const isSoundEnabled = () => soundEnabled;

/**
 * Play a calm, sine wave harmonic chime
 */
export const playTone = (frequency = 528, duration = 0.25, type: OscillatorType = 'sine', gainVal = 0.1) => {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Smooth envelope attack and decay to prevent audio clicks
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainVal, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio context may be restricted before user gesture
  }
};

/**
 * Positive gentle harmonic chord (C-E-G 528Hz Solfeggio / calm bell)
 */
export const playHarmonicSuccess = () => {
  if (!soundEnabled) return;
  const frequencies = [528, 660, 792];
  frequencies.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.4, 'sine', 0.08);
    }, idx * 70);
  });
};

/**
 * Soft feedback tap / click
 */
export const playSoftTap = () => {
  if (!soundEnabled) return;
  playTone(440, 0.08, 'triangle', 0.05);
};

/**
 * Gentle low tone for missed cue (non-punitive, warm)
 */
export const playGentleNotice = () => {
  if (!soundEnabled) return;
  playTone(260, 0.2, 'sine', 0.06);
};

/**
 * Celebration melody for game completion
 */
export const playCelebration = () => {
  if (!soundEnabled) return;
  const notes = [392, 523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.5, 'sine', 0.09);
    }, idx * 100);
  });
};
