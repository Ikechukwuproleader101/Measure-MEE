/**
 * Geometric A-Pose and Side Alignment Validation Rules
 * 
 * Pure functions for validating human pose landmarks extracted via MediaPipe.
 * Works on normalized coordinates [0, 1] without React or DOM dependencies.
 */

export const LANDMARK_INDEX = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};

export const THRESHOLDS = {
  minVisibility: 0.6,          // required landmark visibility threshold
  frameMargin: 0.02,           // landmarks must sit inside 2%..98% of the frame
  armAngleMin: 25,             // degrees between torso line and arm, at the shoulder
  armAngleMax: 55,             // degrees between torso line and arm, at the shoulder
  elbowStraightMin: 155,       // degrees at the elbow (arms roughly straight)
  legSpreadMin: 0.8,           // ankle distance / hip width
  legSpreadMax: 2.0,           // ankle distance / hip width
  facingMaxZDiff: 0.15,        // |leftShoulder.z - rightShoulder.z|
  bodyHeightMin: 0.60,         // nose-to-ankle as fraction of frame height
  bodyHeightMax: 0.92,         // nose-to-ankle as fraction of frame height
  stableFramesToPass: 8,       // consecutive valid frames before turning green
  failFramesToDrop: 3,         // consecutive invalid frames before turning red

  // Side view specific thresholds
  sideShoulderMaxXDiff: 0.14,  // shoulders should align in depth / profile in X plane
  sideHipMaxXDiff: 0.14,       // hips profile alignment
  sideArmTorsoMaxAngle: 25,    // arms resting down close to torso line
};

/**
 * Calculates angle ABC (angle at vertex B) in degrees using 2D coordinates.
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b - Vertex
 * @param {{x: number, y: number}} c
 * @returns {number} Angle in degrees [0, 180]
 */
export function angleBetween(a, b, c) {
  if (!a || !b || !c) return 0;

  const abX = a.x - b.x;
  const abY = a.y - b.y;
  const cbX = c.x - b.x;
  const cbY = c.y - b.y;

  const dot = abX * cbX + abY * cbY;
  const magAB = Math.sqrt(abX * abX + abY * abY);
  const magCB = Math.sqrt(cbX * cbX + cbY * cbY);

  if (magAB === 0 || magCB === 0) return 0;

  const cosTheta = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

/**
 * Euclidean distance in 2D space.
 */
export function distance2D(a, b) {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Validates Front-Facing A-Pose.
 * 
 * @param {Array<{x: number, y: number, z?: number, visibility?: number}>} landmarks
 * @param {typeof THRESHOLDS} [customThresholds]
 * @returns {{ valid: boolean, reasons: string[], metrics: Record<string, any> }}
 */
export function validateAPose(landmarks, customThresholds = THRESHOLDS) {
  const t = customThresholds;

  if (!landmarks || landmarks.length < 29) {
    return {
      valid: false,
      reasons: ['No person detected in frame'],
      metrics: {},
    };
  }

  const reasons = [];
  const metrics = {};

  const nose = landmarks[LANDMARK_INDEX.NOSE];
  const lShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const lElbow = landmarks[LANDMARK_INDEX.LEFT_ELBOW];
  const rElbow = landmarks[LANDMARK_INDEX.RIGHT_ELBOW];
  const lWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST];
  const rWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST];
  const lHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
  const rHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];
  const lAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
  const rAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

  const requiredLandmarks = [
    { pt: nose, name: 'head' },
    { pt: lShoulder, name: 'left shoulder' },
    { pt: rShoulder, name: 'right shoulder' },
    { pt: lElbow, name: 'left elbow' },
    { pt: rElbow, name: 'right elbow' },
    { pt: lWrist, name: 'left wrist' },
    { pt: rWrist, name: 'right wrist' },
    { pt: lHip, name: 'left hip' },
    { pt: rHip, name: 'right hip' },
    { pt: lAnkle, name: 'left ankle' },
    { pt: rAnkle, name: 'right ankle' },
  ];

  // 1. Check Visibility
  const lowVisibility = requiredLandmarks.filter(
    ({ pt }) => (pt.visibility ?? 1) < t.minVisibility
  );
  if (lowVisibility.length > 0) {
    reasons.push('Make sure your whole body is visible');
  }

  // 2. Check In Frame Bounds
  const outOfBounds = requiredLandmarks.some(
    ({ pt }) =>
      pt.x < t.frameMargin ||
      pt.x > 1 - t.frameMargin ||
      pt.y < t.frameMargin ||
      pt.y > 1 - t.frameMargin
  );
  if (outOfBounds) {
    reasons.push('Step back so your whole body fits');
  }

  // 3. Body Height / Distance Check
  const avgAnkleY = (lAnkle.y + rAnkle.y) / 2;
  const bodyHeight = avgAnkleY - nose.y;
  metrics.bodyHeight = bodyHeight;

  if (bodyHeight < t.bodyHeightMin) {
    reasons.push('Move closer to the camera');
  } else if (bodyHeight > t.bodyHeightMax) {
    reasons.push('Step back from the camera');
  }

  // 4. Facing Camera Check (Z-Depth difference of shoulders)
  if (lShoulder.z !== undefined && rShoulder.z !== undefined) {
    const zDiff = Math.abs(lShoulder.z - rShoulder.z);
    metrics.shoulderZDiff = zDiff;
    if (zDiff > t.facingMaxZDiff) {
      reasons.push('Face the camera straight on');
    }
  }

  // 5. Arm Angles (A-Shape: angle between torso shoulder->hip and arm shoulder->wrist)
  const leftArmAngle = angleBetween(lHip, lShoulder, lWrist);
  const rightArmAngle = angleBetween(rHip, rShoulder, rWrist);
  metrics.leftArmAngle = leftArmAngle;
  metrics.rightArmAngle = rightArmAngle;

  const minArmAngle = Math.min(leftArmAngle, rightArmAngle);
  const maxArmAngle = Math.max(leftArmAngle, rightArmAngle);

  if (minArmAngle < t.armAngleMin) {
    reasons.push('Raise your arms slightly into an A-pose');
  } else if (maxArmAngle > t.armAngleMax) {
    reasons.push('Lower your arms to about 40 degrees from your body');
  }

  // 6. Straight Elbows
  const leftElbowAngle = angleBetween(lShoulder, lElbow, lWrist);
  const rightElbowAngle = angleBetween(rShoulder, rElbow, rWrist);
  metrics.leftElbowAngle = leftElbowAngle;
  metrics.rightElbowAngle = rightElbowAngle;

  if (leftElbowAngle < t.elbowStraightMin || rightElbowAngle < t.elbowStraightMin) {
    reasons.push('Straighten your arms');
  }

  // 7. Leg Spread (Ankle distance / hip width)
  const hipWidth = distance2D(lHip, rHip);
  const ankleDist = distance2D(lAnkle, rAnkle);
  const legRatio = hipWidth > 0 ? ankleDist / hipWidth : 1;
  metrics.legRatio = legRatio;

  if (legRatio < t.legSpreadMin || legRatio > t.legSpreadMax) {
    reasons.push('Stand with feet shoulder-width apart');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    metrics,
  };
}

/**
 * Validates Side-Profile Alignment.
 * 
 * @param {Array<{x: number, y: number, z?: number, visibility?: number}>} landmarks
 * @param {typeof THRESHOLDS} [customThresholds]
 * @returns {{ valid: boolean, reasons: string[], metrics: Record<string, any> }}
 */
export function validateSidePose(landmarks, customThresholds = THRESHOLDS) {
  const t = customThresholds;

  if (!landmarks || landmarks.length < 29) {
    return {
      valid: false,
      reasons: ['No person detected in frame'],
      metrics: {},
    };
  }

  const reasons = [];
  const metrics = {};

  const nose = landmarks[LANDMARK_INDEX.NOSE];
  const lShoulder = landmarks[LANDMARK_INDEX.LEFT_SHOULDER];
  const rShoulder = landmarks[LANDMARK_INDEX.RIGHT_SHOULDER];
  const lElbow = landmarks[LANDMARK_INDEX.LEFT_ELBOW];
  const rElbow = landmarks[LANDMARK_INDEX.RIGHT_ELBOW];
  const lWrist = landmarks[LANDMARK_INDEX.LEFT_WRIST];
  const rWrist = landmarks[LANDMARK_INDEX.RIGHT_WRIST];
  const lHip = landmarks[LANDMARK_INDEX.LEFT_HIP];
  const rHip = landmarks[LANDMARK_INDEX.RIGHT_HIP];
  const lAnkle = landmarks[LANDMARK_INDEX.LEFT_ANKLE];
  const rAnkle = landmarks[LANDMARK_INDEX.RIGHT_ANKLE];

  // In side view, one side is facing camera more. We need at least one full side clearly visible.
  const leftVis = (lShoulder.visibility ?? 1) + (lHip.visibility ?? 1) + (lAnkle.visibility ?? 1);
  const rightVis = (rShoulder.visibility ?? 1) + (rHip.visibility ?? 1) + (rAnkle.visibility ?? 1);
  const dominantSide = leftVis >= rightVis ? 'left' : 'right';
  metrics.dominantSide = dominantSide;

  const keyShoulder = dominantSide === 'left' ? lShoulder : rShoulder;
  const keyHip = dominantSide === 'left' ? lHip : rHip;
  const keyAnkle = dominantSide === 'left' ? lAnkle : rAnkle;
  const keyElbow = dominantSide === 'left' ? lElbow : rElbow;
  const keyWrist = dominantSide === 'left' ? lWrist : rWrist;

  // 1. Visibility Check
  if ((nose.visibility ?? 1) < t.minVisibility || (keyShoulder.visibility ?? 1) < t.minVisibility || (keyAnkle.visibility ?? 1) < t.minVisibility) {
    reasons.push('Make sure your full profile is visible');
  }

  // 2. In Frame Bounds
  const pointsToCheck = [nose, keyShoulder, keyHip, keyAnkle];
  const outOfBounds = pointsToCheck.some(
    (pt) =>
      pt.x < t.frameMargin ||
      pt.x > 1 - t.frameMargin ||
      pt.y < t.frameMargin ||
      pt.y > 1 - t.frameMargin
  );
  if (outOfBounds) {
    reasons.push('Step back so your whole body fits');
  }

  // 3. Body Height / Distance
  const bodyHeight = keyAnkle.y - nose.y;
  metrics.bodyHeight = bodyHeight;
  if (bodyHeight < t.bodyHeightMin) {
    reasons.push('Move closer to the camera');
  } else if (bodyHeight > t.bodyHeightMax) {
    reasons.push('Step back from the camera');
  }

  // 4. Side Profile Alignment (Narrow shoulder distance in X axis)
  const shoulderXDiff = Math.abs(lShoulder.x - rShoulder.x);
  metrics.shoulderXDiff = shoulderXDiff;

  // If shoulders are spread wide in X, user is still facing forward instead of sideways
  if (shoulderXDiff > t.sideShoulderMaxXDiff) {
    reasons.push('Turn sideways 90° for profile view');
  }

  // 5. Arm at side
  const armAngle = angleBetween(keyHip, keyShoulder, keyWrist);
  metrics.sideArmAngle = armAngle;
  if (armAngle > t.sideArmTorsoMaxAngle) {
    reasons.push('Keep arms naturally down by your side');
  }

  // 6. Straight posture
  const elbowAngle = angleBetween(keyShoulder, keyElbow, keyWrist);
  metrics.elbowAngle = elbowAngle;
  if (elbowAngle < 135) {
    reasons.push('Keep arms relaxed and extended');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    metrics,
  };
}

/**
 * High-level pose validator for a given view mode ('front' | 'side')
 * 
 * @param {Array<{x: number, y: number, z?: number, visibility?: number}>} landmarks
 * @param {'front' | 'side'} mode
 * @returns {{ valid: boolean, reasons: string[], metrics: Record<string, any> }}
 */
export function validatePoseByMode(landmarks, mode = 'front') {
  if (mode === 'side') {
    return validateSidePose(landmarks);
  }
  return validateAPose(landmarks);
}
