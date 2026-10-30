// still used by uploads / side photo
import { IDX, SIDE_THRESHOLDS as T } from "./poseConstants.js";

const px = (p, w, h) => ({ x: p.x * w, y: p.y * h });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Angle in degrees at point b, between lines b->a and b->c.
function angleAt(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!m) return 0;
  const cos = (v1.x * v2.x + v1.y * v2.y) / m;
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

export function validateSidePose(landmarks, { width = 1280, height = 720 } = {}) {
  if (!landmarks || landmarks.length < 33) {
    return { valid: false, reasons: ["Step into the camera view"] };
  }
  const lm = landmarks;
  const reasons = [];

  // 1 & 2) Choose camera-facing side based on average visibility of left vs right keypoints
  const leftIndices = [IDX.leftShoulder, IDX.leftElbow, IDX.leftWrist, IDX.leftHip, IDX.leftKnee, IDX.leftAnkle];
  const rightIndices = [IDX.rightShoulder, IDX.rightElbow, IDX.rightWrist, IDX.rightHip, IDX.rightKnee, IDX.rightAnkle];

  const leftAvgVis = leftIndices.reduce((acc, i) => acc + (lm[i]?.visibility ?? 0), 0) / leftIndices.length;
  const rightAvgVis = rightIndices.reduce((acc, i) => acc + (lm[i]?.visibility ?? 0), 0) / rightIndices.length;

  const isLeft = leftAvgVis >= rightAvgVis;
  const side = isLeft
    ? {
        s: IDX.leftShoulder,
        e: IDX.leftElbow,
        w: IDX.leftWrist,
        h: IDX.leftHip,
        k: IDX.leftKnee,
        a: IDX.leftAnkle,
      }
    : {
        s: IDX.rightShoulder,
        e: IDX.rightElbow,
        w: IDX.rightWrist,
        h: IDX.rightHip,
        k: IDX.rightKnee,
        a: IDX.rightAnkle,
      };

  const sidePoints = [side.s, side.e, side.w, side.h, side.k, side.a];
  const requiredPoints = [IDX.nose, ...sidePoints];

  // 3) Visible: nose + all six points of side have visibility >= minVisibility
  if (requiredPoints.some((i) => (lm[i]?.visibility ?? 0) < T.minVisibility)) {
    reasons.push("Make sure your whole body is visible");
  }

  // 4) In frame: nose and six side points inside frameMargin to 1 - frameMargin
  const m = T.frameMargin;
  if (requiredPoints.some((i) => lm[i].x < m || lm[i].x > 1 - m || lm[i].y < m || lm[i].y > 1 - m)) {
    reasons.push("Step back so your whole body fits");
  }

  if (reasons.length > 0) {
    return { valid: false, reasons };
  }

  // 5) Distance: (side ankle y - nose y) between bodyHeightMin and bodyHeightMax
  const bodyH = lm[side.a].y - lm[IDX.nose].y;
  if (bodyH < T.bodyHeightMin) {
    reasons.push("Move a little closer");
  } else if (bodyH > T.bodyHeightMax) {
    reasons.push("Step back a little");
  }

  // 6) Sideways: shoulder separation / torso length <= maxShoulderSeparation
  const pxLeftS = px(lm[IDX.leftShoulder], width, height);
  const pxRightS = px(lm[IDX.rightShoulder], width, height);
  const pxLeftH = px(lm[IDX.leftHip], width, height);
  const pxRightH = px(lm[IDX.rightHip], width, height);

  const shoulderMid = {
    x: (pxLeftS.x + pxRightS.x) / 2,
    y: (pxLeftS.y + pxRightS.y) / 2,
  };
  const hipMid = {
    x: (pxLeftH.x + pxRightH.x) / 2,
    y: (pxLeftH.y + pxRightH.y) / 2,
  };

  const shoulderSep = dist(pxLeftS, pxRightS);
  const torsoLength = dist(shoulderMid, hipMid);

  if (torsoLength > 0 && shoulderSep / torsoLength > T.maxShoulderSeparation) {
    reasons.push("Turn 90 degrees so you are facing sideways");
  }

  // 7) Arms relaxed: angle at the side shoulder between hip and wrist <= maxArmAngle
  const pxS = px(lm[side.s], width, height);
  const pxH = px(lm[side.h], width, height);
  const pxW = px(lm[side.w], width, height);
  const armAngle = angleAt(pxH, pxS, pxW);

  if (armAngle > T.maxArmAngle) {
    reasons.push("Let your arms hang naturally at your sides");
  }

  // 8) Upright: |side shoulder x - side ankle x| / body height in pixels <= maxLean
  const pxA = px(lm[side.a], width, height);
  const bodyHeightPx = bodyH * height;

  if (bodyHeightPx > 0 && Math.abs(pxS.x - pxA.x) / bodyHeightPx > T.maxLean) {
    reasons.push("Stand up straight");
  }

  return { valid: reasons.length === 0, reasons };
}
