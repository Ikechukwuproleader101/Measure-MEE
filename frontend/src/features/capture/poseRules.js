/**
 * Pose and tilt evaluation rules and thresholds.
 * Central configuration for body-part feedback, tilt sensing, and capture gating.
 */

export const RULES = {
  tilt: {
    pitch: { min: -6, max: 6, buffer: 3 },   // degrees from upright (0 = upright)
    roll:  { min: -5, max: 5, buffer: 3 },   // degrees sideways (0 = level)
    veryTiltedPitch: 40,                     // beyond this: "stand your phone upright"
    shakeDegPerSec: 20,                      // tilt change per second above this = shaking
    noDataMs: 1500,                          // no tilt readings after this = sensor unavailable
  },
  body: {
    minVisibility: 0.4,
    frameMargin: 0.02,
    heightFracMin: 0.55,        // nose to ankle as a fraction of video height
    heightFracMax: 0.92,
    centerOffsetMax: 0.12,      // hips center must be within 12% of screen center
  },
  arm: {
    angle: { min: 30, max: 50, buffer: 5 },    // degrees between the torso line and the arm (ideal about 40)
    elbow: { min: 150, max: 180, buffer: 5 },  // degrees at the elbow (180 = straight)
  },
  leg: {
    knee: { min: 160, max: 180, buffer: 5 },
    spread: { min: 0.6, max: 1.7, buffer: 0.08 }, // ankle distance divided by shoulder width
  },
  shoulders: { tilt: { min: -6, max: 6, buffer: 3 } },  // degrees from horizontal
  torso: { lean: { min: -8, max: 8, buffer: 3 } },      // degrees from vertical
  smoothingAlpha: 0.5,
  hold: { passMs: 300, failMs: 250 },
  capture: { countdownSeconds: 3, rangeScale: 1.25, graceMs: 500, failsBeforeAnyway: 3 },
  cues: { minGapMs: 3000, repeatMs: 5000 },
  TARGET_ARM_ANGLE: 40,
  SHOW_TARGET_HINTS: true,      // faint dashed arm and foot targets; set false to remove
};

export const AUTO_START_WHEN_GREEN = false;

/**
 * Checks if a value is inside a range with hysteresis and optional scale.
 *
 * @param {number} value
 * @param {{ min: number, max: number, buffer?: number }} range
 * @param {boolean} [wasOk=false]  previous state for hysteresis
 * @param {number} [scale=1]       widens the range around its center (e.g. 1.25 for capture)
 * @returns {boolean}
 */
export function rangeCheck(value, range, wasOk = false, scale = 1) {
  if (!range || typeof value !== 'number' || isNaN(value)) return false;

  const center = (range.min + range.max) / 2;
  const halfWidth = ((range.max - range.min) / 2) * scale;
  const sMin = center - halfWidth;
  const sMax = center + halfWidth;
  const buffer = (range.buffer || 0) * scale;

  if (wasOk) {
    return value >= sMin - buffer && value <= sMax + buffer;
  }
  return value >= sMin && value <= sMax;
}

/**
 * Creates a hold tracker that enforces a continuous pass duration before
 * turning valid, and requires a continuous fail duration before dropping.
 */
export function createHoldTracker({
  passHoldMs = RULES.hold.passMs,
  failHoldMs = RULES.hold.failMs,
} = {}) {
  let valid = false;
  let passStartMs = null;
  let failStartMs = null;
  let _lastValidAtMs = 0;

  return {
    update(pass, nowMs) {
      if (pass) {
        failStartMs = null;
        if (passStartMs === null) passStartMs = nowMs;
        if (!valid && nowMs - passStartMs >= passHoldMs) {
          valid = true;
        }
        if (valid) {
          _lastValidAtMs = nowMs;
        }
      } else {
        passStartMs = null;
        if (failStartMs === null) failStartMs = nowMs;
        if (valid && nowMs - failStartMs >= failHoldMs) {
          valid = false;
        }
      }
      return valid;
    },
    isValid() {
      return valid;
    },
    lastValidAtMs() {
      return _lastValidAtMs;
    },
    reset() {
      valid = false;
      passStartMs = null;
      failStartMs = null;
      _lastValidAtMs = 0;
    },
  };
}

/**
 * Determines if capture should proceed at countdown zero.
 * True if valid now, or was valid within graceMs.
 */
export function shouldCaptureAtZero({
  isValid,
  lastValidAtMs,
  nowMs,
  graceMs = RULES.capture.graceMs,
}) {
  if (isValid) return true;
  if (lastValidAtMs > 0 && nowMs - lastValidAtMs <= graceMs) return true;
  return false;
}

/**
 * Applies exponential smoothing to landmark positions.
 */
export function smoothJoints(prev, curr, alpha = RULES.smoothingAlpha) {
  if (!prev) return curr ? JSON.parse(JSON.stringify(curr)) : null;
  if (!curr) return prev;

  const result = Array.isArray(curr) ? [] : {};
  for (const key of Object.keys(curr)) {
    const p = prev[key];
    const c = curr[key];
    if (p && c && typeof c.x === 'number' && typeof c.y === 'number') {
      result[key] = {
        ...c,
        x: p.x + alpha * (c.x - p.x),
        y: p.y + alpha * (c.y - p.y),
        z: c.z !== undefined && p.z !== undefined ? p.z + alpha * (c.z - p.z) : c.z,
      };
    } else {
      result[key] = c;
    }
  }
  return result;
}

