export const IDX = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
};

// Starting values. Keep every threshold here so they are easy to tune.
// not used by the live camera — kept for validateAPose.js and its tests
export const THRESHOLDS = {
  minVisibility: 0.6,     // each required point must be at least this visible
  frameMargin: 0.02,      // points must be inside 2%..98% of the frame
  armAngleMin: 25,        // degrees between torso and arm, measured at the shoulder
  armAngleMax: 55,
  elbowStraightMin: 155,  // degrees at the elbow (arm roughly straight)
  legSpreadMin: 0.8,      // ankle distance divided by hip width
  legSpreadMax: 2.2,
  facingMaxZDiff: 0.15,   // allowed difference between the two shoulders' z
  bodyHeightMin: 0.55,    // nose-to-ankle as a fraction of frame height
  bodyHeightMax: 0.92,
  stableFramesToPass: 8,  // consecutive good frames before turning green
  failFramesToDrop: 3,    // consecutive bad frames before leaving green
  maxDetectionsPerSecond: 15,
};

export const SIDE_THRESHOLDS = {
  minVisibility: 0.5,        // only the camera-facing side is required
  frameMargin: 0.02,
  bodyHeightMin: 0.55,       // nose to ankle as fraction of frame height
  bodyHeightMax: 0.92,
  maxShoulderSeparation: 0.35, // shoulder-to-shoulder distance / torso length
  maxArmAngle: 30,           // degrees at the shoulder between torso and arm
  maxLean: 0.2,              // |shoulder x - ankle x| / body height
};

export const COUNTDOWN_SECONDS = 3;

export const COLORS = {
  valid: "#22c55e",   // green
  invalid: "#ef4444", // red
  none: "#ffffff",    // no person in view
};

export function guideState({ personVisible = false, isValid = false } = {}) {
  if (isValid) return "valid";
  if (personVisible) return "invalid";
  return "idle";
}

// ---- Original owner silhouette restored ----
// viewBox 0 0 340 560 — the artwork from CameraCaptureScreen before last change.
// Joint positions estimated from the original SVG geometry.
export const GUIDE = {
  viewBox: { w: 340, h: 560 },
  bounds: { top: 30, bottom: 530, left: 68, right: 268 },
  // SVG shapes for rendering
  head: "M170 54 C153 54 143 68 143 88 C143 108 153 124 170 124 C187 124 197 108 197 88 C197 68 187 54 170 54 Z",
  body: "M158 123 C157 132 153 138 144 142 C132 147 114 156 104 175 C95 192 84 225 78 260 C72 292 68 335 72 360 C73 365 77 368 81 364 C84 360 87 348 90 330 C95 295 106 255 114 225 C118 208 122 195 125 188 C127 205 129 235 131 270 C133 300 131 328 126 355 C120 388 114 430 110 475 C108 495 107 518 106 525 C109 527 121 528 127 525 C129 515 133 480 138 438 C143 395 148 355 152 320 C156 288 163 260 170 252 C177 260 184 288 188 320 C192 355 197 395 202 438 C207 480 211 515 213 525 C219 528 231 527 234 525 C233 518 232 495 230 475 C226 430 220 388 214 355 C209 328 207 300 209 270 C211 235 213 205 215 188 C218 195 222 208 226 225 C234 255 245 295 250 330 C253 348 256 360 259 364 C263 368 267 365 268 360 C272 335 268 292 262 260 C256 225 245 192 236 175 C226 156 208 147 196 142 C187 138 183 132 182 123",
  centerLine: { x1: 170, y1: 30, x2: 170, y2: 530 },
  joints: {
    nose:           [170, 89],
    leftShoulder:   [144, 142],  rightShoulder:  [196, 142],
    leftElbow:      [97, 198],   rightElbow:     [243, 198],
    leftWrist:      [78, 260],   rightWrist:     [262, 260],
    leftHip:        [131, 270],  rightHip:       [209, 270],
    leftKnee:       [122, 395],  rightKnee:      [218, 395],
    leftAnkle:      [112, 525],  rightAnkle:     [228, 525],
  },
};

// ---- Fit-to-guide config (the live camera checker) ----
export const FIT_CONFIG = {
  // zone radius as a fraction of the silhouette's height (figH * k in pixels)
  radius: {
    nose: 0.07, leftShoulder: 0.06, rightShoulder: 0.06,
    leftHip: 0.07, rightHip: 0.07,
    leftElbow: 0.07, rightElbow: 0.07,
    leftKnee: 0.07, rightKnee: 0.07,
    leftWrist: 0.09, rightWrist: 0.09,
    leftAnkle: 0.08, rightAnkle: 0.08,
  },
  coreJoints: [
    "nose", "leftShoulder", "rightShoulder", "leftHip", "rightHip",
    "leftWrist", "rightWrist", "leftAnkle", "rightAnkle",
  ],
  allowedMisses: 1,          // among the non-core joints (elbows, knees)
  minVisibilityCore: 0.4,
  smoothingAlpha: 0.5,       // joint smoothing; 1 = no smoothing
  passHoldMs: 300,           // fit must hold this long before turning green
  failHoldMs: 250,           // must fail this long before leaving green
  captureRadiusScale: 1.3,   // extra room for the final check at capture time
  captureGraceMs: 500,       // green within this time counts at capture
  countdownSeconds: 3,
};

// ---- Built-in (fallback) silhouette from the previous task ----
// Kept as GUIDE_BUILTIN so tests and code can reference it if needed
export const GUIDE_BUILTIN = {
  viewBox: { w: 400, h: 600 },
  bounds: { top: 58, bottom: 560, left: 46, right: 354 },
  joints: {
    nose:           [200, 95],
    leftShoulder:   [150, 150],  rightShoulder:  [250, 150],
    leftElbow:      [102, 220],  rightElbow:     [298, 220],
    leftWrist:      [54, 290],   rightWrist:     [346, 290],
    leftHip:        [165, 300],  rightHip:       [235, 300],
    leftKnee:       [160, 420],  rightKnee:      [240, 420],
    leftAnkle:      [155, 535],  rightAnkle:     [245, 535],
  },
};

/** Do not auto-start countdown when green; manual button only. */
export const AUTO_START_WHEN_GREEN = false;
