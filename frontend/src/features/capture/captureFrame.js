import { getCaptureLandmarker } from "../../services/poseLandmarker.js";
import { processSegmentationMask } from "./maskUtils.js";

/**
 * Captures the current frame from a HTMLVideoElement at full native resolution,
 * runs MediaPipe Pose in IMAGE mode with segmentation masks, re-validates the pose
 * on the exact captured frame, and extracts a non-mirrored JPEG blob with mask & landmarks.
 *
 * @param {Object} options
 * @param {HTMLVideoElement} options.video
 * @param {"front" | "side"} options.view
 * @param {Function} [options.validator]
 * @returns {Promise<import('./captureSession.js').CaptureResult | { error: string }>}
 */
export async function captureFrame({ video, view, validator }) {
  if (!video || !video.videoWidth || !video.videoHeight) {
    return { error: "Camera stream is not ready." };
  }

  // 1. Draw current video frame to an offscreen canvas at full resolution (NOT mirrored)
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { error: "Failed to initialize image context." };
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    // 2. Run capture-time landmarker with segmentation mask
    const landmarker = await getCaptureLandmarker();
    const result = landmarker.detect(canvas);

    // 3. Ensure landmarks exist
    const landmarks = result?.landmarks?.[0];
    const worldLandmarks = result?.worldLandmarks?.[0];
    if (!landmarks || !worldLandmarks) {
      return { error: "We couldn't see you clearly. Try again." };
    }

    // 4. Re-check the pose on these captured-frame landmarks with validator
    if (typeof validator === "function") {
      const validation = validator(landmarks, {
        width: canvas.width,
        height: canvas.height,
      });
      if (!validation.valid) {
        const firstReason = validation.reasons?.[0] || "We couldn't see your pose clearly. Try again.";
        return { error: firstReason };
      }
    }

    // 5. Convert mask to binary Uint8Array and free WASM mask memory
    let mask = null;
    const rawMask = result?.segmentationMasks?.[0];
    if (rawMask) {
      mask = processSegmentationMask(rawMask);
    }

    // 6. Generate unmirrored JPEG blob (quality 0.92) & previewUrl
    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.92
      );
    });

    if (!imageBlob) {
      return { error: "Failed to create photo file." };
    }

    const previewUrl = URL.createObjectURL(imageBlob);

    return {
      view,
      imageBlob,
      previewUrl,
      width: canvas.width,
      height: canvas.height,
      landmarks,
      worldLandmarks,
      mask,
      capturedAt: Date.now(),
    };
  } catch (err) {
    console.error("captureFrame error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to capture frame.",
    };
  }
}
