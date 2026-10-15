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

