import { COLORS } from './poseConstants.js';
import { RULES } from './poseRules.js';

/**
 * Returns rendering style for a given body part state.
 *
 * @param {'ok'|'bad'|'unseen'|'neutral'} state
 * @returns {{ color: string, lineDash: number[], lineWidth: number, lineCap: CanvasLineCap }}
 */
export function partStyle(state) {
  switch (state) {
    case 'ok':
      return {
        color: COLORS.valid || '#22c55e',
        lineDash: [],
        lineWidth: 6,
        lineCap: 'round',
      };
    case 'bad':
      return {
        color: COLORS.invalid || '#ef4444',
        lineDash: [10, 8],
        lineWidth: 3,
        lineCap: 'round',
      };
    case 'unseen':
      return {
        color: '#9ca3af',
        lineDash: [2, 8],
        lineWidth: 3,
        lineCap: 'round',
      };
    case 'neutral':
    default:
      return {
        color: 'rgba(255, 255, 255, 0.5)',
        lineDash: [],
        lineWidth: 2,
        lineCap: 'round',
      };
  }
}

/**
 * Connects standard MediaPipe pose landmark indices for debug skeleton drawing.
 */
const SKELETON_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Upper body
  [11, 23], [12, 24], [23, 24],                     // Torso
  [23, 25], [25, 27], [24, 26], [26, 28],          // Legs
];

/**
 * Draws the colored body-part lines, target hints, and optional debug skeleton.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} params
 */
export function drawLimbsOverlay(canvas, {
  landmarks,
  parts = {},
  metrics = null,
  videoW = 720,
  videoH = 1280,
  wholeBodyOk = true,
  tiltOk = true,
  showSkeleton = false,
  showTargetHints = RULES.SHOW_TARGET_HINTS,
}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks || landmarks.length < 33 || !metrics) {
    return;
  }

  const scale = (videoH || 720) / 720;
  const { joints, torsoDir, shoulderWidth, hipMid } = metrics;

  // 1. Debug Mode: Draw underlying faint skeleton
  if (showSkeleton) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([4, 4]);

    for (const [i, j] of SKELETON_CONNECTIONS) {
      const lmA = landmarks[i];
      const lmB = landmarks[j];
      if (lmA && lmB && (lmA.visibility ?? 0) > 0.2 && (lmB.visibility ?? 0) > 0.2) {
        ctx.beginPath();
        ctx.moveTo(lmA.x * videoW, lmA.y * videoH);
        ctx.lineTo(lmB.x * videoW, lmB.y * videoH);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 2. Helper to draw line segment with part style
  const drawLine = (ptA, ptB, style) => {
    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth * scale;
    ctx.setLineDash(style.lineDash.map((d) => d * scale));
    ctx.lineCap = style.lineCap;
    ctx.beginPath();
    ctx.moveTo(ptA.x, ptA.y);
    ctx.lineTo(ptB.x, ptB.y);
    ctx.stroke();
    ctx.restore();
  };

  const drawJointDot = (pt, style) => {
    ctx.save();
    ctx.fillStyle = style.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, Math.max(3, (style.lineWidth / 1.5) * scale), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // 3. Draw Parts in order: Shoulders, Torso, Legs, Arms
  // Shoulders
  const shStyle = partStyle(parts.shoulders?.state || 'neutral');
  drawLine(joints.leftShoulder, joints.rightShoulder, shStyle);
  drawJointDot(joints.leftShoulder, shStyle);
  drawJointDot(joints.rightShoulder, shStyle);

  // Torso (shoulders to hips and hip line)
  const torsoStyle = partStyle(parts.torso?.state || 'neutral');
  drawLine(joints.leftShoulder, joints.leftHip, torsoStyle);
  drawLine(joints.rightShoulder, joints.rightHip, torsoStyle);
  drawLine(joints.leftHip, joints.rightHip, torsoStyle);
  drawJointDot(joints.leftHip, torsoStyle);
  drawJointDot(joints.rightHip, torsoStyle);

  // Left Leg: hip to knee to ankle
  const leftLegStyle = partStyle(parts.leftLeg?.state || 'neutral');
  drawLine(joints.leftHip, joints.leftKnee, leftLegStyle);
  drawLine(joints.leftKnee, joints.leftAnkle, leftLegStyle);
  drawJointDot(joints.leftKnee, leftLegStyle);
  drawJointDot(joints.leftAnkle, leftLegStyle);

  // Right Leg: hip to knee to ankle
  const rightLegStyle = partStyle(parts.rightLeg?.state || 'neutral');
  drawLine(joints.rightHip, joints.rightKnee, rightLegStyle);
  drawLine(joints.rightKnee, joints.rightAnkle, rightLegStyle);
  drawJointDot(joints.rightKnee, rightLegStyle);
  drawJointDot(joints.rightAnkle, rightLegStyle);

  // Left Arm: shoulder to elbow to wrist
  const leftArmStyle = partStyle(parts.leftArm?.state || 'neutral');
  drawLine(joints.leftShoulder, joints.leftElbow, leftArmStyle);
  drawLine(joints.leftElbow, joints.leftWrist, leftArmStyle);
  drawJointDot(joints.leftElbow, leftArmStyle);
  drawJointDot(joints.leftWrist, leftArmStyle);

  // Right Arm: shoulder to elbow to wrist
  const rightArmStyle = partStyle(parts.rightArm?.state || 'neutral');
  drawLine(joints.rightShoulder, joints.rightElbow, rightArmStyle);
  drawLine(joints.rightElbow, joints.rightWrist, rightArmStyle);
  drawJointDot(joints.rightElbow, rightArmStyle);
  drawJointDot(joints.rightWrist, rightArmStyle);

  // 4. Target hints (only when whole-body and tilt are OK, and part is bad)
  if (showTargetHints && wholeBodyOk && tiltOk) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([6 * scale, 6 * scale]);

    const targetAngleRad = (RULES.TARGET_ARM_ANGLE * Math.PI) / 180;

    // Helper to rotate vector (vx, vy) by angle in screen coords
    const rotateVec = (vx, vy, rad) => ({
      x: vx * Math.cos(rad) - vy * Math.sin(rad),
      y: vx * Math.sin(rad) + vy * Math.cos(rad),
    });

    // Left Arm target (if bad)
    if (parts.leftArm?.state === 'bad') {
      const sh = joints.leftShoulder;
      // Determine outward direction from torsoDir
      // In screen coords, if shoulder is to the left of hipMid, outward rotation moves left (dx < 0)
      const isLeftOfHips = sh.x < hipMid.x;
      const angleSign = isLeftOfHips ? -1 : 1;
      const armDir = rotateVec(torsoDir.x, torsoDir.y, angleSign * targetAngleRad);
      const armLen = metrics.leftArmLength || 150 * scale;

      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x + armDir.x * armLen, sh.y + armDir.y * armLen);
      ctx.stroke();
    }

    // Right Arm target (if bad)
    if (parts.rightArm?.state === 'bad') {
      const sh = joints.rightShoulder;
      const isLeftOfHips = sh.x < hipMid.x;
      const angleSign = isLeftOfHips ? -1 : 1;
      const armDir = rotateVec(torsoDir.x, torsoDir.y, angleSign * targetAngleRad);
      const armLen = metrics.rightArmLength || 150 * scale;

      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x + armDir.x * armLen, sh.y + armDir.y * armLen);
      ctx.stroke();
    }

    // Foot targets (if either leg is bad)
    if (parts.leftLeg?.state === 'bad' || parts.rightLeg?.state === 'bad') {
      const radius = 14 * scale;
      const ankleY = (joints.leftAnkle.y + joints.rightAnkle.y) / 2;
      const targetLeftAnkleX = hipMid.x - shoulderWidth / 2;
      const targetRightAnkleX = hipMid.x + shoulderWidth / 2;

      // Left foot target circle
      ctx.beginPath();
      ctx.arc(targetLeftAnkleX, ankleY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Right foot target circle
      ctx.beginPath();
      ctx.arc(targetRightAnkleX, ankleY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

