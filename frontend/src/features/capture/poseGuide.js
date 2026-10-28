import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import { COLORS } from "./poseConstants.js";

export const GUIDE_VIEWBOX = { w: 400, h: 600 };

// Head: circle. Body: one closed outline path.
export const GUIDE_HEAD = { cx: 200, cy: 92, r: 34 };
export const GUIDE_BODY_PATH =
  "M185 128 L152 140 L138 142 L46 285 L63 296 L149 172 L152 190 L168 250 " +
  "L158 320 L142 425 L141 535 L128 560 L172 560 L169 535 L178 425 L200 335 " +
  "L222 425 L231 535 L228 560 L272 560 L259 535 L258 425 L242 320 L232 250 " +
  "L248 190 L251 172 L337 296 L354 285 L262 142 L248 140 L215 128 Z";

// The joints this pose represents, in the same SVG units.
// Arms are straight and 40 degrees from the torso; feet are about shoulder width apart.
export const GUIDE_KEYPOINTS = {
  nose: [200, 95],
  leftShoulder: [150, 150],  rightShoulder: [250, 150],
  leftElbow: [102.1, 220.2], rightElbow: [297.9, 220.2],
  leftWrist: [54.2, 290.4],  rightWrist: [345.8, 290.4],
  leftHip: [165, 300],       rightHip: [235, 300],
  leftAnkle: [155, 535],     rightAnkle: [245, 535],
};

// Nose-to-ankle distance in SVG units, used for scaling.
export const GUIDE_NOSE_TO_ANKLE = 440; // 535 - 95
export const GUIDE_FIGURE_BOUNDS = { top: 58, bottom: 560, left: 46, right: 354 };

/**
 * Places the guide silhouette within the visible camera viewport box.
 * Sizing preserves aspect ratio, guarantees box containment with a 3% margin,
 * and centers the figure's midpoint (200, 309) in the box.
 *
 * @param {Object|number} arg1 - Options object or videoW
 * @param {number} [arg2] - videoH
 * @param {number} [arg3] - boxW
 * @param {number} [arg4] - boxH
 * @param {string} [arg5] - fit ('cover' | 'contain')
 * @returns {{ k: number, tx: number, ty: number, fActual: number, warning: boolean, transform: string }}
 */
export function placeGuide(arg1, arg2, arg3, arg4, arg5) {
  let videoW, videoH, boxW, boxH, fit;

  if (typeof arg1 === "object" && arg1 !== null) {
    ({ videoW, videoH, boxW, boxH, fit = "cover" } = arg1);
  } else {
    videoW = arg1;
    videoH = arg2;
    boxW = arg3;
    boxH = arg4;
    fit = arg5 ?? "cover";
  }

  if (!videoW || !videoH || !boxW || !boxH) {
    return {
      k: 1,
      tx: 0,
      ty: 0,
      fActual: 0,
      warning: true,
      transform: "translate(0, 0) scale(1)",
    };
  }

  const cs =
    fit === "cover"
      ? Math.max(boxW / videoW, boxH / videoH)
      : Math.min(boxW / videoW, boxH / videoH);

  const fDesired = 0.733; // nose-to-ankle as a fraction of VIDEO height
  const kDesired = (fDesired / GUIDE_NOSE_TO_ANKLE) * videoH * cs; // box pixels per SVG unit
  const margin = 0.03 * Math.min(boxW, boxH);
  const figureH = GUIDE_FIGURE_BOUNDS.bottom - GUIDE_FIGURE_BOUNDS.top; // 502
  const figureW = GUIDE_FIGURE_BOUNDS.right - GUIDE_FIGURE_BOUNDS.left; // 308
  const kMax = Math.min((boxH - 2 * margin) / figureH, (boxW - 2 * margin) / figureW);
  const k = Math.min(kDesired, kMax);
  const fActual = (k * GUIDE_NOSE_TO_ANKLE) / (videoH * cs); // what the guide really represents

  const tx = boxW / 2 - 200 * k;
  const ty = boxH / 2 - 309 * k;
  const transform = `translate(${tx}, ${ty}) scale(${k})`;
  const warning = fActual < 0.6;

  return { k, tx, ty, fActual, warning, transform };
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
 *
 * @param {boolean} [showSkeleton=false]
 * @returns {boolean}
 */
export function shouldDrawSkeleton(showSkeleton = false) {
  return Boolean(showSkeleton);
}

/**
 * Helper to conditionally draw skeleton overlay on HTML5 canvas.
 * When showSkeleton is false, skips all canvas drawing and returns false.
 *
 * @param {HTMLCanvasElement|null} canvas
 * @param {Array<any>|null} landmarks
 * @param {Object} options
 * @param {string} [options.color]
 * @param {boolean} [options.showSkeleton=false]
 * @returns {boolean} Whether drawing was performed
 */
export function drawSkeletonOverlay(canvas, landmarks, { color = COLORS.invalid, showSkeleton = false } = {}) {
  if (!showSkeleton || !canvas || !landmarks || landmarks.length === 0) {
    return false;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
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

