import { IDX, FIT_CONFIG } from "./poseConstants.js";

/**
 * Maps a single landmark from normalized video coords to box (screen) pixels.
 * @param {number} u  normalized x (0..1)
 * @param {number} v  normalized y (0..1)
 * @param {{ videoW: number, videoH: number, boxW: number, boxH: number, cs: number, mirrored?: boolean }} p
 * @returns {{ x: number, y: number }}
 */
function landmarkToBox(u, v, { videoW, videoH, boxW, boxH, cs, mirrored }) {
  let bx = boxW / 2 + (u - 0.5) * videoW * cs;
  const by = boxH / 2 + (v - 0.5) * videoH * cs;
  if (mirrored) bx = boxW - bx;
  return { x: bx, y: by };
}

/**
 * Target spot from artwork coords to box pixels.
 */
function jointToBox(ax, ay, { tx, ty, k }) {
  return { x: tx + ax * k, y: ty + ay * k };
}

const JOINT_NAMES = [
  "nose",
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
  "leftAnkle", "rightAnkle",
];

const PAIRED = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
];

/**
 * Core "fit to guide" check.
 *
 * @param {Object} params
 * @param {Array} params.landmarks       raw MediaPipe landmarks (33 entries, normalized 0..1)
 * @param {Object} params.placement      { k, tx, ty, cs } from placeGuide
 * @param {number} params.videoW
 * @param {number} params.videoH
 * @param {number} params.boxW
 * @param {number} params.boxH
 * @param {string} [params.fit="cover"]
 * @param {boolean} [params.mirrored=false]
 * @param {number} [params.radiusScale=1]
 * @param {Object} [params.guide]        artwork definition { joints, bounds }
 * @param {Object} [params.config]       fit config override
 * @returns {{ pass: boolean, hint: string, joints: Array, size: { ratio: number, dx: number, dy: number } }}
 */
export function fitToGuide({
  landmarks,
  placement,
  videoW,
  videoH,
  boxW,
  boxH,
  fit: _fit = "cover",
  mirrored = false,
  radiusScale = 1,
  guide,
  config = FIT_CONFIG,
}) {
  if (!landmarks || landmarks.length < 33 || !placement || !guide) {
    return {
      pass: false,
      hint: "Step into the camera view",
      joints: [],
      size: { ratio: 0, dx: 0, dy: 0 },
    };
  }

  const { k, tx, ty, cs } = placement;
  const figH = (guide.bounds.bottom - guide.bounds.top) * k;
  const figW = (guide.bounds.right - guide.bounds.left) * k;
  const boxParams = { videoW, videoH, boxW, boxH, cs, mirrored };

  // 1. Map person joints to box pixels
  const personBoxMap = {};
  for (const name of JOINT_NAMES) {
    const idx = IDX[name];
    if (idx === undefined) continue;
    const lm = landmarks[idx];
    if (!lm) continue;
    const bp = landmarkToBox(lm.x, lm.y, boxParams);
    personBoxMap[name] = { ...bp, visibility: lm.visibility ?? 0 };
  }

  // 2. Map target joints to box pixels
  const targetBoxMap = {};
  for (const name of JOINT_NAMES) {
    const artPt = guide.joints[name];
    if (!artPt) continue;
    targetBoxMap[name] = jointToBox(artPt[0], artPt[1], { tx, ty, k });
  }

  // 3. Mirror-agnostic left/right pairing: sort by displayed bx
  const pairedPerson = {};
  const pairedTarget = {};
  for (const [left, right] of PAIRED) {
    const pL = personBoxMap[left];
    const pR = personBoxMap[right];
    const tL = targetBoxMap[left];
    const tR = targetBoxMap[right];

    if (pL && pR) {
      const personSorted = [
        { name: left, pt: pL },
        { name: right, pt: pR },
      ].sort((a, b) => a.pt.x - b.pt.x);
      pairedPerson[left] = personSorted[0].pt;
      pairedPerson[right] = personSorted[1].pt;
      // carry visibility
      pairedPerson[left].visibility = personSorted[0].pt.visibility;
      pairedPerson[right].visibility = personSorted[1].pt.visibility;
    }

    if (tL && tR) {
      const targetSorted = [
        { name: left, pt: tL },
        { name: right, pt: tR },
      ].sort((a, b) => a.pt.x - b.pt.x);
      pairedTarget[left] = targetSorted[0].pt;
      pairedTarget[right] = targetSorted[1].pt;
    }
  }

  // For nose (unpaired), just use directly
  pairedPerson.nose = personBoxMap.nose;
  pairedTarget.nose = targetBoxMap.nose;

  // 4. Per-joint distance check
  const jointResults = [];
  const coreJoints = config.coreJoints || FIT_CONFIG.coreJoints;
  const radii = config.radius || FIT_CONFIG.radius;
  const minVisCoreVal = config.minVisibilityCore ?? FIT_CONFIG.minVisibilityCore;
  const allowedMissesVal = config.allowedMisses ?? FIT_CONFIG.allowedMisses;

  let coreVisibilityFail = false;
  let coreFailCount = 0;
  let nonCoreFailCount = 0;
  let worstJointName = "";
  let worstRatio = 0;

  for (const name of JOINT_NAMES) {
    const person = pairedPerson[name] || personBoxMap[name];
    const target = pairedTarget[name] || targetBoxMap[name];
    const radiusFrac = radii[name] ?? 0.07;
    const radiusPx = radiusFrac * figH * radiusScale;

    if (!person || !target) {
      const isCore = coreJoints.includes(name);
      jointResults.push({
        name,
        x: person?.x ?? 0,
        y: person?.y ?? 0,
        tx: target?.x ?? 0,
        ty: target?.y ?? 0,
        radius: radiusPx,
        dist: Infinity,
        ok: false,
      });
      if (isCore) coreFailCount++;
      else nonCoreFailCount++;
      continue;
    }

    const dist = Math.hypot(person.x - target.x, person.y - target.y);
    const ok = dist <= radiusPx;
    const isCore = coreJoints.includes(name);

    // Visibility check for core joints
    if (isCore && (person.visibility ?? 0) < minVisCoreVal) {
      coreVisibilityFail = true;
    }

    if (!ok) {
      if (isCore) coreFailCount++;
      else nonCoreFailCount++;
    }

    const ratio = radiusPx > 0 ? dist / radiusPx : Infinity;
    if (ratio > worstRatio) {
      worstRatio = ratio;
      worstJointName = name;
    }

    jointResults.push({
      name,
      x: person.x,
      y: person.y,
      tx: target.x,
      ty: target.y,
      radius: radiusPx,
      dist,
      ok,
    });
  }

  // 5. Size and position for hints
  const noseP = pairedPerson.nose || personBoxMap.nose;
  const leftAnkleP = pairedPerson.leftAnkle || personBoxMap.leftAnkle;
  const rightAnkleP = pairedPerson.rightAnkle || personBoxMap.rightAnkle;

  const noseT = pairedTarget.nose || targetBoxMap.nose;
  const leftAnkleT = pairedTarget.leftAnkle || targetBoxMap.leftAnkle;
  const rightAnkleT = pairedTarget.rightAnkle || targetBoxMap.rightAnkle;

  let ratio = 1;
  let dx = 0;
  let dy = 0;

  if (noseP && leftAnkleP && rightAnkleP && noseT && leftAnkleT && rightAnkleT) {
    const ankleAvgP = {
      x: (leftAnkleP.x + rightAnkleP.x) / 2,
      y: (leftAnkleP.y + rightAnkleP.y) / 2,
    };
    const ankleAvgT = {
      x: (leftAnkleT.x + rightAnkleT.x) / 2,
      y: (leftAnkleT.y + rightAnkleT.y) / 2,
    };
    const personHeight = Math.hypot(noseP.x - ankleAvgP.x, noseP.y - ankleAvgP.y);
    const guideHeight = Math.hypot(noseT.x - ankleAvgT.x, noseT.y - ankleAvgT.y);
    ratio = guideHeight > 0 ? personHeight / guideHeight : 1;

    // Center of person vs center of guide
    const personCx = (noseP.x + ankleAvgP.x) / 2;
    const personCy = (noseP.y + ankleAvgP.y) / 2;
    const guideCx = (noseT.x + ankleAvgT.x) / 2;
    const guideCy = (noseT.y + ankleAvgT.y) / 2;
    dx = personCx - guideCx;
    dy = personCy - guideCy;
  }

  // 6. Pass / fail
  const pass =
    !coreVisibilityFail &&
    coreFailCount === 0 &&
    nonCoreFailCount <= allowedMissesVal;

  // 7. Hint
  let hint = "";
  if (!pass) {
    if (coreVisibilityFail) {
      hint = "Make sure your whole body is visible";
    } else if (ratio < 0.8) {
      hint = "Move a little closer";
    } else if (ratio > 1.25) {
      hint = "Step back a little";
    } else if (figW > 0 && Math.abs(dx) > 0.10 * figW) {
      // Directions as the user sees the screen
      hint = dx > 0 ? "Move a little to the left" : "Move a little to the right";
    } else {
      // Check which joints are outside
      const failedNames = jointResults.filter((j) => !j.ok).map((j) => j.name);
      const hasArms = failedNames.some(
        (n) =>
          n === "leftWrist" ||
          n === "rightWrist" ||
          n === "leftElbow" ||
          n === "rightElbow"
      );
      const hasLegs = failedNames.some(
        (n) =>
          n === "leftAnkle" ||
          n === "rightAnkle" ||
          n === "leftKnee" ||
          n === "rightKnee"
      );
      if (hasArms) {
        hint = "Match your arms to the outline";
      } else if (hasLegs) {
        hint = "Match your feet to the outline";
      } else {
        hint = "Line up your body with the outline";
      }
    }
  } else {
    hint = "";
  }

  const worstJointResult = jointResults.reduce(
    (worst, j) => {
      const jRatio = j.radius > 0 ? j.dist / j.radius : 0;
      const wRatio = worst && worst.radius > 0 ? worst.dist / worst.radius : 0;
      return jRatio > wRatio ? j : worst;
    },
    jointResults[0] || null
  );

  const worstJoint = worstJointResult
    ? {
        name: worstJointResult.name,
        dist: worstJointResult.dist,
        maxDist: worstJointResult.radius,
        ratio: worstJointResult.radius > 0 ? worstJointResult.dist / worstJointResult.radius : 0,
      }
    : null;

  return {
    pass,
    hint,
    ratio: Math.round(ratio * 1000) / 1000,
    dx: Math.round(dx * 10) / 10,
    dy: Math.round(dy * 10) / 10,
    worstJoint,
    missedJoints: jointResults.filter((j) => !j.ok).map((j) => j.name),
    joints: jointResults,
    size: { ratio, dx, dy },
    _debug: { worstJointName, worstRatio },
  };
}

// ---- Hold tracker (time-based debouncing) ----

/**
 * Creates a hold tracker with hysteresis.
 * @param {{ passHoldMs?: number, failHoldMs?: number }} opts
 * @returns {{ update: (pass: boolean, nowMs: number) => boolean, isValid: () => boolean, lastValidAtMs: () => number }}
 */
export function createHoldTracker({
  passHoldMs = FIT_CONFIG.passHoldMs,
  failHoldMs = FIT_CONFIG.failHoldMs,
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
    /** Reset state (useful for view mode changes). */
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
  graceMs = FIT_CONFIG.captureGraceMs,
}) {
  if (isValid) return true;
  if (lastValidAtMs > 0 && nowMs - lastValidAtMs <= graceMs) return true;
  return false;
}

// ---- Smoothing helper ----

/**
 * Applies exponential smoothing to joint positions.
 * @param {Object} prev  previous smoothed positions { nose: {x,y}, ... }
 * @param {Object} curr  current raw positions { nose: {x,y}, ... }
 * @param {number} alpha  smoothing factor (1 = no smoothing, 0 = ignore new data)
 * @returns {Object} smoothed positions
 */
export function smoothJoints(prev, curr, alpha = FIT_CONFIG.smoothingAlpha) {
  if (!prev) return { ...curr };
  const result = {};
  for (const name of Object.keys(curr)) {
    if (prev[name]) {
      result[name] = {
        x: prev[name].x + alpha * (curr[name].x - prev[name].x),
        y: prev[name].y + alpha * (curr[name].y - prev[name].y),
        visibility: curr[name].visibility,
      };
    } else {
      result[name] = { ...curr[name] };
    }
  }
  return result;
}

// ---- Record-pose helpers ----

/**
 * Convert box pixels to artwork coordinates.
 */
export function boxToArtwork(arg1, arg2, arg3) {
  let bx, by, placement;
  if (typeof arg1 === 'object' && arg1 !== null) {
    bx = arg1.x;
    by = arg1.y;
    placement = { ...arg2 };
    if (typeof arg3 === 'boolean') placement.mirrored = arg3;
  } else {
    bx = arg1;
    by = arg2;
    placement = arg3 || {};
  }
  const { tx = 0, ty = 0, k = 1, mirrored = false, boxW } = placement;
  let x = bx;
  if (mirrored) {
    const w = boxW !== undefined ? boxW : tx * 2 + 340 * k;
    x = w - x;
  }
  return {
    x: (x - tx) / k,
    y: (by - ty) / k,
  };
}

/**
 * Convert artwork coordinates to box pixels.
 */
export function artworkToBox(arg1, arg2, arg3) {
  let ax, ay, placement;
  if (typeof arg1 === 'object' && arg1 !== null) {
    ax = arg1.x;
    ay = arg1.y;
    placement = { ...arg2 };
    if (typeof arg3 === 'boolean') placement.mirrored = arg3;
  } else {
    ax = arg1;
    ay = arg2;
    placement = arg3 || {};
  }
  const { tx = 0, ty = 0, k = 1, mirrored = false, boxW } = placement;
  let bx = tx + ax * k;
  const by = ty + ay * k;
  if (mirrored) {
    const w = boxW !== undefined ? boxW : tx * 2 + 340 * k;
    bx = w - bx;
  }
  return { x: bx, y: by };
}

