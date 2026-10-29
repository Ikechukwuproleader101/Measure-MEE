import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import { COLORS, GUIDE } from "./poseConstants.js";

// Re-export the guide artwork shapes for the overlay component
export const GUIDE_HEAD_PATH = GUIDE.head;
export const GUIDE_BODY_PATH = GUIDE.body;
export const GUIDE_CENTER_LINE = GUIDE.centerLine;

/**
 * Places a guide silhouette within the visible camera viewport box.
 * Works with any artwork definition (GUIDE object).
 *
 * @param {Object} opts
 * @param {number} opts.videoW
 * @param {number} opts.videoH
 * @param {number} opts.boxW
 * @param {number} opts.boxH
 * @param {string} [opts.fit="cover"]
 * @param {Object} [opts.guide]  artwork definition with bounds
 * @returns {{ k: number, tx: number, ty: number, cs: number }}
 */
export function placeGuide(arg1, arg2, arg3, arg4, arg5) {
  let videoW, videoH, boxW, boxH, fit, guide;

  if (typeof arg1 === "object" && arg1 !== null) {
    ({ videoW, videoH, boxW, boxH, fit = "cover", guide } = arg1);
  } else {
    videoW = arg1;
    videoH = arg2;
    boxW = arg3;
    boxH = arg4;
    fit = arg5 ?? "cover";
  }

  if (!guide) guide = GUIDE;

  if (!videoW || !videoH || !boxW || !boxH) {
    return { k: 1, tx: 0, ty: 0, cs: 1 };
  }

  const cs =
    fit === "cover"
      ? Math.max(boxW / videoW, boxH / videoH)
      : Math.min(boxW / videoW, boxH / videoH);

  const margin = 0.03 * Math.min(boxW, boxH);
  const figH = guide.bounds.bottom - guide.bounds.top;
  const figW = guide.bounds.right - guide.bounds.left;
  const k = Math.min(0.88 * boxH / figH, (boxW - 2 * margin) / figW);

  const cx = (guide.bounds.left + guide.bounds.right) / 2;
  const cy = (guide.bounds.top + guide.bounds.bottom) / 2;
  const tx = boxW / 2 - cx * k;
  const ty = boxH / 2 - cy * k;

  return { k, tx, ty, cs };
}

/**
 * Checks whether the debug pose mode is enabled in URL search params or hash.
 * Enables skeleton rendering when debug=pose is present.
 *
 * @param {Location|string|null} [locationOrString]
 * @returns {boolean}
 */
export function parsePoseDebug(locationOrString) {
  if (!locationOrString) return false;
  let search = "";
  let hash = "";

  if (typeof locationOrString === "string") {
    try {
      const u = new URL(locationOrString, "http://localhost");
      search = u.search;
      hash = u.hash;
    } catch {
      const qIdx = locationOrString.indexOf("?");
      const hIdx = locationOrString.indexOf("#");
      search = qIdx !== -1 ? locationOrString.slice(qIdx) : "";
      hash = hIdx !== -1 ? locationOrString.slice(hIdx) : "";
    }
  } else {
    search = locationOrString.search || "";
    hash = locationOrString.hash || "";
  }

  // 1. Search string check
  if (search) {
    const searchClean = search.startsWith("?") ? search.slice(1) : search;
    const searchParams = new URLSearchParams(searchClean);
    if (searchParams.get("debug") === "pose") return true;
  }

  // 2. Hash check (handles both #debug=pose and #/route?debug=pose)
  if (hash) {
    const hashClean = hash.startsWith("#") ? hash.slice(1) : hash;
    const hashQIdx = hashClean.indexOf("?");
    const hashQuery = hashQIdx !== -1 ? hashClean.slice(hashQIdx + 1) : hashClean;
    const hashParams = new URLSearchParams(hashQuery);
    if (hashParams.get("debug") === "pose") return true;
  }

  return false;
}

/**
 * Pure helper for drawing decision.
 */
export function shouldDrawSkeleton(showSkeleton = false) {
  return Boolean(showSkeleton);
}

const SKELETON_CONNECTIONS = [
  ["nose", "leftShoulder"],
  ["nose", "rightShoulder"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
];

/**
 * Helper to conditionally draw skeleton and calibration overlay on HTML5 canvas.
 * When showSkeleton is false, skips all canvas drawing and returns false.
 */
export function drawSkeletonOverlay(
  canvas,
  landmarks,
  { color = COLORS.invalid, showSkeleton = false, fitResult = null } = {}
) {
  if (!showSkeleton || !canvas) {
    return false;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If fitResult is available (front A-pose), draw in box coordinates
  if (fitResult?.joints?.length) {
    const jointMap = {};
    for (const j of fitResult.joints) {
      jointMap[j.name] = j;
    }

    // 1. Target zones (thin circles)
    for (const j of fitResult.joints) {
      if (j.tx !== undefined && j.ty !== undefined && j.radius > 0) {
        ctx.beginPath();
        ctx.arc(j.tx, j.ty, j.radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 2. Skeleton connectors in state colors
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    for (const [startName, endName] of SKELETON_CONNECTIONS) {
      const p1 = jointMap[startName];
      const p2 = jointMap[endName];
      if (p1 && p2 && p1.dist !== Infinity && p2.dist !== Infinity) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // 3. Detected joint dots (green if inside zone, red if outside)
    for (const j of fitResult.joints) {
      if (j.dist !== Infinity) {
        ctx.beginPath();
        ctx.arc(j.x, j.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = j.ok ? COLORS.valid : COLORS.invalid;
        ctx.fill();
      }
    }

    return true;
  }

  // Fallback for side view or raw landmark rendering
  if (landmarks && landmarks.length > 0) {
    const drawingUtils = new DrawingUtils(ctx);
    drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
      color,
      lineWidth: 4,
    });
    drawingUtils.drawLandmarks(landmarks, {
      color,
      fillColor: color,
      radius: 4,
    });
    return true;
  }

  return false;
}
