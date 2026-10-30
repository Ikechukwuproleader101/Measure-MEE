// still used by uploads / side photo
import { IDX, THRESHOLDS as T } from "./poseConstants.js";

const REQUIRED = [
  IDX.nose,
  IDX.leftShoulder, IDX.rightShoulder,
  IDX.leftElbow, IDX.rightElbow,
  IDX.leftWrist, IDX.rightWrist,
  IDX.leftHip, IDX.rightHip,
  IDX.leftAnkle, IDX.rightAnkle,
];

const px = (p, w, h) => ({ x: p.x * w, y: p.y * h });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Angle in degrees at point b, between the lines b->a and b->c.
export function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!m) return 0;
  const cos = (v1.x * v2.x + v1.y * v2.y) / m;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

export function validateAPose(landmarks, { width = 1280, height = 720 } = {}) {
  if (!landmarks || landmarks.length < 33) {
    return { valid: false, reasons: ["Step into the camera view"] };
  }
  const lm = landmarks;
  const reasons = [];

  // 1) Everything visible and inside the frame. If this fails, the other
  //    measurements are unreliable, so stop here.
  if (REQUIRED.some((i) => (lm[i].visibility ?? 0) < T.minVisibility)) {
    reasons.push("Make sure your whole body is visible");
  }
  const m = T.frameMargin;
  if (REQUIRED.some((i) => lm[i].x < m || lm[i].x > 1 - m || lm[i].y < m || lm[i].y > 1 - m)) {
    reasons.push("Step back so your whole body fits");
  }
  if (reasons.length) return { valid: false, reasons };

  // 2) Distance from the camera.
  const ankleY = (lm[IDX.leftAnkle].y + lm[IDX.rightAnkle].y) / 2;
  const bodyH = ankleY - lm[IDX.nose].y;
  if (bodyH < T.bodyHeightMin) reasons.push("Move a little closer");
  else if (bodyH > T.bodyHeightMax) reasons.push("Step back a little");

  // 3) Facing the camera straight on.
  if (Math.abs(lm[IDX.leftShoulder].z - lm[IDX.rightShoulder].z) > T.facingMaxZDiff) {
    reasons.push("Face the camera straight on");
  }

  // 4) Arms: A-shape and fairly straight, both sides.
  let armsTooLow = false, armsTooHigh = false, elbowsBent = false;
  const sides = [
    { s: IDX.leftShoulder, e: IDX.leftElbow, w: IDX.leftWrist, h: IDX.leftHip },
    { s: IDX.rightShoulder, e: IDX.rightElbow, w: IDX.rightWrist, h: IDX.rightHip },
  ];
  for (const side of sides) {
    const S = px(lm[side.s], width, height);
    const E = px(lm[side.e], width, height);
    const W = px(lm[side.w], width, height);
    const H = px(lm[side.h], width, height);
    const armAngle = angleAt(H, S, W);   // torso line vs arm line
    const elbowAngle = angleAt(S, E, W); // 180 = perfectly straight
    if (armAngle < T.armAngleMin) armsTooLow = true;
    else if (armAngle > T.armAngleMax) armsTooHigh = true;
    if (elbowAngle < T.elbowStraightMin) elbowsBent = true;
  }
  if (armsTooLow) reasons.push("Move your arms slightly away from your body");
  if (armsTooHigh) reasons.push("Lower your arms a little");
  if (elbowsBent) reasons.push("Straighten your arms");

  // 5) Feet about shoulder-width apart.
  const hipW = dist(px(lm[IDX.leftHip], width, height), px(lm[IDX.rightHip], width, height));
  const ankleD = dist(px(lm[IDX.leftAnkle], width, height), px(lm[IDX.rightAnkle], width, height));
  const spread = hipW ? ankleD / hipW : 0;
  if (spread < T.legSpreadMin) reasons.push("Open your feet to about shoulder width");
  else if (spread > T.legSpreadMax) reasons.push("Bring your feet a little closer");

  return { valid: reasons.length === 0, reasons };
}
