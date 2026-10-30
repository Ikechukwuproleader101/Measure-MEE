import { RULES } from './poseRules.js';

let audioCtx = null;
const STORAGE_KEY = 'measure_me_camera_muted';

/**
 * Returns whether audio cues are currently muted.
 */
export function isAudioMuted() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Updates the mute preference.
 */
export function setAudioMuted(muted) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Primes Web Audio and SpeechSynthesis on user interaction.
 */
export function unlockAudio() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch {
    // ignore
  }

  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  } catch {
    // ignore
  }
}

/**
 * Pure function determining whether a sound cue should play.
 *
 * @param {Object} params
 * @param {'closer'|'further'|null} params.cue
 * @param {'closer'|'further'|null} params.lastCue
 * @param {number} params.lastPlayedAtMs
 * @param {number} params.nowMs
 * @returns {boolean}
 */
export function cueDecision({
  cue,
  lastCue = null,
  lastPlayedAtMs = 0,
  nowMs = 0,
}) {
  if (!cue) return false;

  const minGapMs = RULES.cues.minGapMs;
  const repeatMs = RULES.cues.repeatMs;

  if (cue !== lastCue) {
    return nowMs - lastPlayedAtMs >= minGapMs;
  }
  return nowMs - lastPlayedAtMs >= repeatMs;
}

/**
 * Pure mapping from hint text to sound cue ('closer' | 'further' | null).
 *
 * @param {string|null} hint
 * @returns {'closer'|'further'|null}
 */
export function cueFromHint(hint) {
  if (!hint || typeof hint !== 'string') return null;
  const lower = hint.toLowerCase();
  if (lower.includes('closer')) return 'closer';
  if (lower.includes('step back')) return 'further';
  return null;
}

/**
 * Plays short synthesized tone using Web Audio.
 */
function playTone(freq, startTime, duration) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.12, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // ignore
  }
}

/**
 * Plays two-note rising chime on transition to valid.
 */
export function playChime() {
  if (isAudioMuted() || typeof window === 'undefined') return;
  unlockAudio();
  if (!audioCtx) return;

  try {
    const t = audioCtx.currentTime;
    playTone(523.25, t, 0.12);         // C5
    playTone(659.25, t + 0.13, 0.22);  // E5
  } catch {
    // ignore
  }
}

/**
 * Plays speech or fallback tones for distance cues.
 *
 * @param {'closer'|'further'} type
 */
export function playDistanceCue(type) {
  if (isAudioMuted() || typeof window === 'undefined') return;
  unlockAudio();

  const text = type === 'closer' ? 'Move closer' : 'Step back';

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      // fallback to tones below
    }
  }

  // Fallback tones
  if (audioCtx) {
    try {
      const t = audioCtx.currentTime;
      if (type === 'closer') {
        playTone(440, t, 0.08);
        playTone(580, t + 0.1, 0.12);
      } else {
        playTone(580, t, 0.08);
        playTone(440, t + 0.1, 0.12);
      }
    } catch {
      // ignore
    }
  }
}

