import { RULES, rangeCheck } from './poseRules.js';
import { calculateBodyMetrics } from './bodyMetrics.js';
import { IDX } from './poseConstants.js';

const REQUIRED_JOINTS = [
  IDX.nose,
  IDX.leftShoulder, IDX.rightShoulder,
  IDX.leftHip, IDX.rightHip,
  IDX.leftAnkle, IDX.rightAnkle,
];

/**
 * Pure evaluation function for body-part pose validation.
 *
 * @param {Object} params
 * @param {Array<{ x: number, y: number, z?: number, visibility?: number }>} params.landmarks
 * @param {number} params.videoW
 * @param {number} params.videoH
 * @param {boolean} [params.mirrored=false]
 * @param {Object} [params.prev=null]
 * @param {number} [params.rangeScale=1]
 * @returns {{
 *   personVisible: boolean,
 *   wholeBody: { ok: boolean, hint: string|null, cue: string|null },
 *   parts: Record<string, { state: 'ok'|'bad'|'unseen'|'neutral', reason?: string }>,
 *   metrics: Object|null,
 *   pass: boolean,
 *   hint: string,
 *   nextPrev: Object|null
 * }}
 */
export function evaluatePose({
  landmarks,
  videoW,
  videoH,
  mirrored = false,
  prev = null,
  rangeScale = 1,
}) {
  if (!landmarks || landmarks.length < 33 || !videoW || !videoH) {
    return {
      personVisible: false,
      wholeBody: { ok: false, hint: 'Step into the camera view', cue: null },
      parts: {},
      metrics: null,
      pass: false,
      hint: 'Step into the camera view',
      nextPrev: null,
    };
  }

  const metrics = calculateBodyMetrics(landmarks, videoW, videoH, mirrored);
  if (!metrics) {
    return {
      personVisible: false,
      wholeBody: { ok: false, hint: 'Step into the camera view', cue: null },
      parts: {},
      metrics: null,
      pass: false,
      hint: 'Step into the camera view',
      nextPrev: null,
    };
  }

  const minVis = RULES.body.minVisibility;
  const margin = RULES.body.frameMargin;

  // 1. Whole-body checks in priority order
  let wholeBody = { ok: true, hint: null, cue: null };

  // Check required joints visibility & frame boundary
  const hasRequiredJointsProblem = REQUIRED_JOINTS.some((idx) => {
    const lm = landmarks[idx];
    if (!lm) return true;
    if ((lm.visibility ?? 0) < minVis) return true;
    if (lm.x < margin || lm.x > 1 - margin || lm.y < margin || lm.y > 1 - margin) return true;
    return false;
  });

  if (hasRequiredJointsProblem) {
    wholeBody = { ok: false, hint: 'Make sure your whole body is visible', cue: null };
  } else if (metrics.heightFrac < RULES.body.heightFracMin) {
    wholeBody = { ok: false, hint: 'Move closer', cue: 'closer' };
  } else if (metrics.heightFrac > RULES.body.heightFracMax) {
    wholeBody = { ok: false, hint: 'Step back', cue: 'further' };
  } else if (metrics.centerOffset > RULES.body.centerOffsetMax) {
    wholeBody = { ok: false, hint: 'Move a little to the left', cue: null };
  } else if (metrics.centerOffset < -RULES.body.centerOffsetMax) {
    wholeBody = { ok: false, hint: 'Move a little to the right', cue: null };
  }

  // 2. Part visibility checks
  const { joints } = metrics;
  const isPartUnseen = {
    leftArm: joints.leftShoulder.visibility < minVis ||
      joints.leftElbow.visibility < minVis ||
      joints.leftWrist.visibility < minVis,
    rightArm: joints.rightShoulder.visibility < minVis ||
      joints.rightElbow.visibility < minVis ||
      joints.rightWrist.visibility < minVis,
    leftLeg: joints.leftHip.visibility < minVis ||
      joints.leftKnee.visibility < minVis ||
      joints.leftAnkle.visibility < minVis,
    rightLeg: joints.rightHip.visibility < minVis ||
      joints.rightKnee.visibility < minVis ||
      joints.rightAnkle.visibility < minVis,
    shoulders: joints.leftShoulder.visibility < minVis ||
      joints.rightShoulder.visibility < minVis,
    torso: joints.leftShoulder.visibility < minVis ||
      joints.rightShoulder.visibility < minVis ||
      joints.leftHip.visibility < minVis ||
      joints.rightHip.visibility < minVis,
  };

  // 3. Part geometry evaluations with rangeCheck & hysteresis
  const leftArmAngleOk = rangeCheck(metrics.leftArmAngle, RULES.arm.angle, prev?.leftArmAngleOk, rangeScale);
  const leftElbowOk = rangeCheck(metrics.leftElbowAngle, RULES.arm.elbow, prev?.leftElbowOk, rangeScale);
  const leftArmOk = !isPartUnseen.leftArm && metrics.leftArmOutward && leftArmAngleOk && leftElbowOk;

  const rightArmAngleOk = rangeCheck(metrics.rightArmAngle, RULES.arm.angle, prev?.rightArmAngleOk, rangeScale);
  const rightElbowOk = rangeCheck(metrics.rightElbowAngle, RULES.arm.elbow, prev?.rightElbowOk, rangeScale);
  const rightArmOk = !isPartUnseen.rightArm && metrics.rightArmOutward && rightArmAngleOk && rightElbowOk;

  const leftKneeOk = rangeCheck(metrics.leftKneeAngle, RULES.leg.knee, prev?.leftKneeOk, rangeScale);
  const rightKneeOk = rangeCheck(metrics.rightKneeAngle, RULES.leg.knee, prev?.rightKneeOk, rangeScale);
  const spreadOk = rangeCheck(metrics.spread, RULES.leg.spread, prev?.spreadOk, rangeScale);

  // A bad spread marks both legs bad
  const leftLegOk = !isPartUnseen.leftLeg && leftKneeOk && spreadOk;
  const rightLegOk = !isPartUnseen.rightLeg && rightKneeOk && spreadOk;

  const shoulderTiltOk = rangeCheck(metrics.shoulderTilt, RULES.shoulders.tilt, prev?.shoulderTiltOk, rangeScale);
  const shouldersOk = !isPartUnseen.shoulders && shoulderTiltOk;

  const torsoLeanOk = rangeCheck(metrics.torsoLean, RULES.torso.lean, prev?.torsoLeanOk, rangeScale);
  const torsoOk = !isPartUnseen.torso && torsoLeanOk;

  const nextPrev = {
    leftArmAngleOk,
    leftElbowOk,
    rightArmAngleOk,
    rightElbowOk,
    leftKneeOk,
    rightKneeOk,
    spreadOk,
    shoulderTiltOk,
    torsoLeanOk,
  };

  // 4. Construct part states (neutral if wholeBody fails)
  const getPartState = (isUnseen, isOk) => {
    if (isUnseen) return 'unseen';
    if (!wholeBody.ok) return 'neutral';
    return isOk ? 'ok' : 'bad';
  };

  const parts = {
    leftArm: { state: getPartState(isPartUnseen.leftArm, leftArmOk) },
    rightArm: { state: getPartState(isPartUnseen.rightArm, rightArmOk) },
    leftLeg: { state: getPartState(isPartUnseen.leftLeg, leftLegOk) },
    rightLeg: { state: getPartState(isPartUnseen.rightLeg, rightLegOk) },
    shoulders: { state: getPartState(isPartUnseen.shoulders, shouldersOk) },
    torso: { state: getPartState(isPartUnseen.torso, torsoOk) },
  };

  // 5. Overall pass
  const anyUnseen = Object.values(isPartUnseen).some(Boolean);
  const allPartsOk = leftArmOk && rightArmOk && leftLegOk && rightLegOk && shouldersOk && torsoOk;
  const pass = wholeBody.ok && !anyUnseen && allPartsOk;

  // 6. Hint priority
  let hint = 'Perfect, hold still';

  if (!wholeBody.ok) {
    hint = wholeBody.hint;
  } else if (anyUnseen) {
    // Unseen parts in priority order: left arm, right arm, legs, shoulders, torso
    if (isPartUnseen.leftArm) {
      hint = "I can't see your left arm";
    } else if (isPartUnseen.rightArm) {
      hint = "I can't see your right arm";
    } else if (isPartUnseen.leftLeg || isPartUnseen.rightLeg) {
      if (joints.leftAnkle.visibility < minVis || joints.rightAnkle.visibility < minVis) {
        hint = "I can't see your feet";
      } else if (isPartUnseen.leftLeg) {
        hint = "I can't see your left leg";
      } else {
        hint = "I can't see your right leg";
      }
    } else if (isPartUnseen.shoulders) {
      hint = "Make sure your shoulders are visible";
    } else if (isPartUnseen.torso) {
      hint = "Make sure your body is visible";
    }
  } else if (!allPartsOk) {
    // Bad parts in priority order: left arm, right arm, left leg, right leg, shoulders, torso
    if (!leftArmOk) {
      if (metrics.leftArmAngle < RULES.arm.angle.min || !metrics.leftArmOutward) {
        hint = "Move your left arm away from your body";
      } else if (metrics.leftArmAngle > RULES.arm.angle.max) {
        hint = "Lower your left arm a little";
      } else if (!leftElbowOk) {
        hint = "Straighten your left arm";
      }
    } else if (!rightArmOk) {
      if (metrics.rightArmAngle < RULES.arm.angle.min || !metrics.rightArmOutward) {
        hint = "Move your right arm away from your body";
      } else if (metrics.rightArmAngle > RULES.arm.angle.max) {
        hint = "Lower your right arm a little";
      } else if (!rightElbowOk) {
        hint = "Straighten your right arm";
      }
    } else if (!leftLegOk) {
      if (!leftKneeOk) {
        hint = "Straighten your left leg";
      } else if (metrics.spread < RULES.leg.spread.min) {
        hint = "Open your feet a little";
      } else if (metrics.spread > RULES.leg.spread.max) {
        hint = "Bring your feet closer";
      }
    } else if (!rightLegOk) {
      if (!rightKneeOk) {
        hint = "Straighten your right leg";
      } else if (metrics.spread < RULES.leg.spread.min) {
        hint = "Open your feet a little";
      } else if (metrics.spread > RULES.leg.spread.max) {
        hint = "Bring your feet closer";
      }
    } else if (!shouldersOk) {
      hint = "Level your shoulders";
    } else if (!torsoOk) {
      hint = "Stand up straight";
    }
  }

  return {
    personVisible: true,
    wholeBody,
    parts,
    metrics,
    pass,
    hint,
    nextPrev,
  };
}

