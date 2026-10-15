import {
  calculateOutlineCoverage,
  calculateMaskPixelHeight,
  calculateScale,
} from "./analysisMath.js";

// NEXT: measurement engine goes here
export async function computeMeasurements({ front: _front, side: _side, frontScale: _frontScale, sideScale: _sideScale } = {}) {
  return { implemented: false };
}

export const ANALYSIS_STAGES = [
  { id: "photos", title: "Checking your photos" },
  { id: "outline", title: "Reading your body outline" },
  { id: "scale", title: "Matching your height" },
  { id: "measure", title: "Calculating measurements" },
];

/**
 * Runs genuine on-device analysis across real stages.
 * Calls onStage(id, state, detail) where state is "waiting" | "active" | "done" | "failed".
 *
 * @param {Object} input
 * @param {number} input.heightCm
 * @param {any} input.front
 * @param {any} input.side
 * @param {Function} [onStage] - (id: string, state: string, detail?: string) => void
 * @returns {Promise<{ ok: boolean, failedStage?: string, error?: string, frontScale?: number, sideScale?: number, frontPixelHeight?: number, sidePixelHeight?: number, message?: string }>}
 */
export async function runAnalysis({ heightCm, front, side }, onStage = () => {}) {
  // Stage 1: photos
  onStage("photos", "active", "Checking your photos");
  if (!front || !side) {
    const err = "One or both photos are missing.";
    onStage("photos", "failed", err);
    return { ok: false, failedStage: "photos", error: err };
  }

  if (
    !Array.isArray(front.landmarks) ||
    front.landmarks.length < 33 ||
    !Array.isArray(side.landmarks) ||
    side.landmarks.length < 33
  ) {
    const err = "Could not identify 33 landmarks on both photos.";
    onStage("photos", "failed", err);
    return { ok: false, failedStage: "photos", error: err };
  }
  onStage("photos", "done", "Photos and landmarks verified");

  // Stage 2: outline
  onStage("outline", "active", "Reading your body outline");
  if (!front.mask || !side.mask) {
    const err = "We couldn't read your outline clearly. Try a plainer background.";
    onStage("outline", "failed", err);
    return { ok: false, failedStage: "outline", error: err };
  }

  const frontCov = calculateOutlineCoverage(front.mask);
  const sideCov = calculateOutlineCoverage(side.mask);
  if (!frontCov.valid || !sideCov.valid) {
    const err = "We couldn't read your outline clearly. Try a plainer background.";
    onStage("outline", "failed", err);
    return { ok: false, failedStage: "outline", error: err };
  }
  onStage("outline", "done", "Body contours extracted");

  // Stage 3: scale
  onStage("scale", "active", "Matching your height");
  const frontPixelH = calculateMaskPixelHeight(front.mask);
  const sidePixelH = calculateMaskPixelHeight(side.mask);

  const frontScaleRes = calculateScale(heightCm, frontPixelH, front.height);
  const sideScaleRes = calculateScale(heightCm, sidePixelH, side.height);

  if (!frontScaleRes.valid) {
    const err = frontScaleRes.error || "Could not calibrate front height scale.";
    onStage("scale", "failed", err);
    return { ok: false, failedStage: "scale", error: err };
  }

  if (!sideScaleRes.valid) {
    const err = sideScaleRes.error || "Could not calibrate side height scale.";
    onStage("scale", "failed", err);
    return { ok: false, failedStage: "scale", error: err };
  }
  onStage("scale", "done", "Height scales calibrated");

  // Stage 4: measure (pluggable measurement calculation)
  onStage("measure", "active", "Calculating measurements");
  const measurementResult = await computeMeasurements({
    front,
    side,
    frontScale: frontScaleRes.cmPerPixel,
    sideScale: sideScaleRes.cmPerPixel,
  });

  const nextMessage =
    "Your photos are ready. Measurement calculation is the next step to be added.";
  onStage("measure", "done", nextMessage);

  return {
    ok: true,
    frontScale: frontScaleRes.cmPerPixel,
    sideScale: sideScaleRes.cmPerPixel,
    frontPixelHeight: frontPixelH,
    sidePixelHeight: sidePixelH,
    measurementsImplemented: measurementResult.implemented,
    message: nextMessage,
  };
}
