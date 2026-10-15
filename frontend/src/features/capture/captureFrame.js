import { getCaptureLandmarker } from "../../services/poseLandmarker.js";
import { processSegmentationMask } from "./maskUtils.js";
import { validateUploadFile } from "./uploadValidation.js";

/**
 * Runs MediaPipe IMAGE mode landmarker, checks landmarks, runs validator,
 * extracts binary mask, and creates an unmirrored JPEG blob with preview URL.
 *
 * For camera: if pose validator fails, returns { error: firstReason }.
 * For upload: if pose validator fails, still returns the CaptureResult with
 *             valid: false and validationError: firstReason, so it displays in the card.
 *
 * @param {Object} options
 * @param {HTMLCanvasElement} options.canvas
 * @param {"front" | "side"} options.view
 * @param {Function} [options.validator]
 * @param {"camera" | "upload"} [options.source="camera"]
 * @returns {Promise<import('./captureSession.js').CaptureResult | { error: string }>}
 */
export async function analyzeCanvas({ canvas, view, validator, source = "camera" }) {
  if (!canvas || !canvas.width || !canvas.height) {
    return { error: "Invalid canvas dimensions." };
  }

  try {
    const landmarker = await getCaptureLandmarker();
    const result = landmarker.detect(canvas);

    const landmarks = result?.landmarks?.[0];
    const worldLandmarks = result?.worldLandmarks?.[0];
    if (!landmarks || !worldLandmarks) {
      return {
        error:
          source === "upload"
            ? "No person clearly detected in this photo. Make sure your full body is visible."
            : "We couldn't see you clearly. Try again.",
      };
    }

    // Pose check
    let valid = true;
    let validationError = null;
    if (typeof validator === "function") {
      const validation = validator(landmarks, {
        width: canvas.width,
        height: canvas.height,
      });
      valid = validation.valid;
      if (!validation.valid) {
        validationError =
          validation.reasons?.[0] || "We couldn't verify your pose in this photo.";
        if (source === "camera") {
          return { error: validationError };
        }
      }
    }

    // Process binary mask
    let mask = null;
    const rawMask = result?.segmentationMasks?.[0];
    if (rawMask) {
      mask = processSegmentationMask(rawMask);
    }

    // Create JPEG blob (0.92 quality)
    const imageBlob = await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });

    if (!imageBlob) {
      return { error: "Failed to create photo file." };
    }

    const previewUrl = URL.createObjectURL(imageBlob);

    return {
      view,
      source,
      imageBlob,
      previewUrl,
      width: canvas.width,
      height: canvas.height,
      landmarks,
      worldLandmarks,
      mask,
      capturedAt: Date.now(),
      valid,
      validationError,
    };
  } catch (err) {
    console.error("analyzeCanvas error:", err);
    return {
      error: err instanceof Error ? err.message : "Failed to analyze photo.",
    };
  }
}

/**
 * Draws current video frame to offscreen canvas and runs analyzeCanvas with source: "camera".
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

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { error: "Failed to initialize image context." };
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return analyzeCanvas({ canvas, view, validator, source: "camera" });
}

/**
 * Validates, decodes, scales, and analyzes an uploaded image file.
 *
 * @param {Object} options
 * @param {File} options.file
 * @param {"front" | "side"} options.view
 * @param {Function} [options.validator]
 * @returns {Promise<import('./captureSession.js').CaptureResult | { error: string }>}
 */
export async function processUploadedImage({ file, view, validator }) {
  const check = validateUploadFile(file);
  if (!check.valid) {
    return { error: check.error || "Please choose a JPG or PNG photo." };
  }

  let bitmap = null;
  try {
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        bitmap = await createImageBitmap(file);
      }
    } else {
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load image."));
        };
        img.src = url;
      });
    }

    if (!bitmap) {
      return { error: "Could not decode photo. Please choose another image." };
    }

    // Scale down so longest side <= 1920 px (preserve aspect ratio)
    let width = bitmap.width;
    let height = bitmap.height;
    const maxSide = 1920;
    if (Math.max(width, height) > maxSide) {
      if (width > height) {
        height = Math.round((height * maxSide) / width);
        width = maxSide;
      } else {
        width = Math.round((width * maxSide) / height);
        height = maxSide;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { error: "Failed to initialize canvas for upload." };
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await analyzeCanvas({ canvas, view, validator, source: "upload" });
  } catch (err) {
    console.error("processUploadedImage error:", err);
    return { error: "Could not read or decode photo. Try another image." };
  } finally {
    if (bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
  }
}
