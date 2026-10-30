import { angleAt } from './validateAPose.js';
import { IDX } from './poseConstants.js';

/**
 * Converts normalized landmark coordinates into pixel space and computes all body metrics.
 * Uses only the person's own proportions for size/build independence.
 *
 * @param {Array<{ x: number, y: number, z?: number, visibility?: number }>} landmarks
 * @param {number} videoW
 * @param {number} videoH
 * @param {boolean} [mirrored=false]
 * @returns {Object|null}
 */
export function calculateBodyMetrics(landmarks, videoW, videoH, mirrored = false) {
  if (!landmarks || landmarks.length < 33 || !videoW || !videoH) {
    return null;
  }

  // Pixel mapping helper
  const px = (idx) => {
    const lm = landmarks[idx] || { x: 0, y: 0, visibility: 0 };
    return {
      x: lm.x * videoW,
      y: lm.y * videoH,
      z: lm.z,
      visibility: lm.visibility ?? 0,
      u: lm.x,
      v: lm.y,
    };
  };

  const nose = px(IDX.nose);
  const leftShoulder = px(IDX.leftShoulder);
  const rightShoulder = px(IDX.rightShoulder);
  const leftElbow = px(IDX.leftElbow);
  const rightElbow = px(IDX.rightElbow);
  const leftWrist = px(IDX.leftWrist);
  const rightWrist = px(IDX.rightWrist);
  const leftHip = px(IDX.leftHip);
  const rightHip = px(IDX.rightHip);
  const leftKnee = px(IDX.leftKnee);
  const rightKnee = px(IDX.rightKnee);
  const leftAnkle = px(IDX.leftAnkle);
  const rightAnkle = px(IDX.rightAnkle);

  // Midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Torso vector & direction (downwards from shoulder midpoint to hip midpoint)
  const torsoVec = {
    x: hipMid.x - shoulderMid.x,
    y: hipMid.y - shoulderMid.y,
  };
  const torsoLen = Math.hypot(torsoVec.x, torsoVec.y);
  const torsoDir = torsoLen > 0
    ? { x: torsoVec.x / torsoLen, y: torsoVec.y / torsoLen }
    : { x: 0, y: 1 };

  // Shoulder width
  const shoulderWidth = Math.hypot(
    leftShoulder.x - rightShoulder.x,
    leftShoulder.y - rightShoulder.y
  );

  // Torso lean: atan2(torsoDir.x, torsoDir.y) in degrees (0 = vertical)
  const torsoLean = (Math.atan2(torsoDir.x, torsoDir.y) * 180) / Math.PI;

  // Shoulder tilt: call smaller x A, larger x B; atan2(B.y - A.y, B.x - A.x) in degrees
  let shA = leftShoulder;
  let shB = rightShoulder;
  if (shA.x > shB.x) {
    shA = rightShoulder;
    shB = leftShoulder;
  }
  const shoulderTilt = (Math.atan2(shB.y - shA.y, shB.x - shA.x) * 180) / Math.PI;

  // Arm angle (each side): angle between torsoDir and (wrist - shoulder)
  const calcArmAngle = (shoulder, wrist) => {
    const armVec = { x: wrist.x - shoulder.x, y: wrist.y - shoulder.y };
    const armLen = Math.hypot(armVec.x, armVec.y);
    if (!armLen) return 0;
    const dot = torsoDir.x * armVec.x + torsoDir.y * armVec.y;
    const cos = Math.max(-1, Math.min(1, dot / armLen));
    return (Math.acos(cos) * 180) / Math.PI;
  };

  const leftArmAngle = calcArmAngle(leftShoulder, leftWrist);
  const rightArmAngle = calcArmAngle(rightShoulder, rightWrist);

  // Arm outward: |wrist.x - hipMid.x| >= |shoulder.x - hipMid.x|
  const leftArmOutward = Math.abs(leftWrist.x - hipMid.x) >= Math.abs(leftShoulder.x - hipMid.x);
  const rightArmOutward = Math.abs(rightWrist.x - hipMid.x) >= Math.abs(rightShoulder.x - hipMid.x);

  // Elbow angles
  const leftElbowAngle = angleAt(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = angleAt(rightShoulder, rightElbow, rightWrist);

  // Knee angles
  const leftKneeAngle = angleAt(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = angleAt(rightHip, rightKnee, rightAnkle);

  // Leg spread: ankle distance / shoulder width
  const ankleDist = Math.hypot(leftAnkle.x - rightAnkle.x, leftAnkle.y - rightAnkle.y);
  const spread = shoulderWidth > 0 ? ankleDist / shoulderWidth : 0;

  // Height fraction: meanAnkleV - noseV (normalized)
  const meanAnkleV = (leftAnkle.v + rightAnkle.v) / 2;
  const heightFrac = meanAnkleV - nose.v;

  // Center offset: displayed hip midpoint U minus 0.5
  const hipMidU = (leftHip.u + rightHip.u) / 2;
  const dispU = mirrored ? 1 - hipMidU : hipMidU;
  const centerOffset = dispU - 0.5;

  // Arm lengths for target hints
  const leftArmLength = Math.hypot(leftElbow.x - leftShoulder.x, leftElbow.y - leftShoulder.y) +
    Math.hypot(leftWrist.x - leftElbow.x, leftWrist.y - leftElbow.y);
  const rightArmLength = Math.hypot(rightElbow.x - rightShoulder.x, rightElbow.y - rightShoulder.y) +
    Math.hypot(rightWrist.x - rightElbow.x, rightWrist.y - rightElbow.y);

  return {
    joints: {
      nose,
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
      leftHip,
      rightHip,
      leftKnee,
      rightKnee,
      leftAnkle,
      rightAnkle,
      shoulderMid,
      hipMid,
    },
    torsoVec,
    torsoDir,
    torsoLen,
    shoulderWidth,
    torsoLean,
    shoulderTilt,
    leftArmAngle,
    rightArmAngle,
    leftArmOutward,
    rightArmOutward,
    leftElbowAngle,
    rightElbowAngle,
    leftKneeAngle,
    rightKneeAngle,
    ankleDist,
    spread,
    heightFrac,
    centerOffset,
    leftArmLength,
    rightArmLength,
  };
}

