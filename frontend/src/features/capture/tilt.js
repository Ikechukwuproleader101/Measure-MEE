import { RULES, rangeCheck } from './poseRules.js';

/**
 * Pure function to evaluate device tilt orientation and motion.
 * Convention: with phone upright in portrait, beta ~ 90, gamma ~ 0.
 * pitch = beta - 90, roll = gamma.
 *
 * @param {Object} params
 * @param {number|null} params.beta
 * @param {number|null} params.gamma
 * @param {string|null} [params.orientationType]
 * @param {number} [params.shakeRate=0]
 * @param {boolean} [params.hasData=false]
 * @param {Object|null} [params.prev=null]
 * @returns {{ ok: boolean, state: string, hint: string|null, pitch: number, roll: number, nextPrev: Object }}
 */
export function evaluateTilt({
  beta = null,
  gamma = null,
  orientationType = '',
  shakeRate = 0,
  hasData = false,
  prev = null,
}) {
  // 1. No sensor data available (desktop, no sensor, or permission denied)
  if (!hasData || beta === null || gamma === null) {
    return {
      ok: true,
      state: 'unavailable',
      hint: 'Keep your phone upright',
      pitch: 0,
      roll: 0,
      nextPrev: { pitchOk: true, rollOk: true },
    };
  }

  const pitch = beta - 90;
  const roll = gamma;

  // 2. Held sideways (landscape orientation)
  const isLandscape = typeof orientationType === 'string' && orientationType.includes('landscape');
  if (isLandscape) {
    return {
      ok: false,
      state: 'landscape',
      hint: 'Turn your phone upright.',
      pitch,
      roll,
      nextPrev: { pitchOk: false, rollOk: false },
    };
  }

  // 3. Upside down: beta between -130 and -50
  if (beta >= -130 && beta <= -50) {
    return {
      ok: false,
      state: 'upside_down',
      hint: 'Your phone is upside down.',
      pitch,
      roll,
      nextPrev: { pitchOk: false, rollOk: false },
    };
  }

  // 4. Flat or nearly flat: |pitch| > veryTiltedPitch (40 deg)
  if (Math.abs(pitch) > RULES.tilt.veryTiltedPitch) {
    return {
      ok: false,
      state: 'very_tilted',
      hint: 'Stand your phone upright.',
      pitch,
      roll,
      nextPrev: { pitchOk: false, rollOk: false },
    };
  }

  // 5. Pitch outside its range (leaning back / forward)
  const pitchOk = rangeCheck(pitch, RULES.tilt.pitch, prev?.pitchOk);
  if (!pitchOk) {
    const hint = pitch < RULES.tilt.pitch.min
      ? 'Your phone is leaning back. Stand it upright.'
      : 'Your phone is leaning forward. Stand it upright.';
    return {
      ok: false,
      state: 'pitch_error',
      hint,
      pitch,
      roll,
      nextPrev: { pitchOk: false, rollOk: prev?.rollOk ?? false },
    };
  }

  // 6. Roll outside its range (tilted sideways)
  const rollOk = rangeCheck(roll, RULES.tilt.roll, prev?.rollOk);
  if (!rollOk) {
    return {
      ok: false,
      state: 'roll_error',
      hint: 'Your phone is tilted to the side. Straighten it.',
      pitch,
      roll,
      nextPrev: { pitchOk: true, rollOk: false },
    };
  }

  // 7. Shaking: shakeRate > shakeDegPerSec
  if (shakeRate > RULES.tilt.shakeDegPerSec) {
    return {
      ok: false,
      state: 'shaking',
      hint: 'Hold the phone steady, or prop it up.',
      pitch,
      roll,
      nextPrev: { pitchOk: true, rollOk: true },
    };
  }

  // 8. Fully upright and steady
  return {
    ok: true,
    state: 'ok',
    hint: null,
    pitch,
    roll,
    nextPrev: { pitchOk: true, rollOk: true },
  };
}

