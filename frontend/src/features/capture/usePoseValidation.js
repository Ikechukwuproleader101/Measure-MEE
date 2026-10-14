import { useState, useEffect, useRef } from "react";
import { DrawingUtils, PoseLandmarker } from "@mediapipe/tasks-vision";
import { getPoseLandmarker } from "../../services/poseLandmarker.js";
import { THRESHOLDS as T, COLORS } from "./poseConstants.js";
import { validateAPose } from "./validateAPose.js";

/**
 * Hook for live A-pose validation, stability smoothing, and canvas skeleton overlay.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLVideoElement | null>} params.videoRef
 * @param {React.RefObject<HTMLCanvasElement | null>} params.canvasRef
 * @param {boolean} [params.enabled=true]
 * @returns {{ isValid: boolean, hint: string, isReady: boolean, error: string | null }}
 */
export function usePoseValidation({ videoRef, canvasRef, enabled = true }) {
  const [isValid, setIsValid] = useState(false);
  const [hint, setHint] = useState("Getting ready...");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const consecutiveValidRef = useRef(0);
  const consecutiveInvalidRef = useRef(0);
  const currentValidRef = useRef(false);
  const currentHintRef = useRef("Getting ready...");
  const lastDetectionTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  const updateValidState = (nextValid) => {
    if (currentValidRef.current !== nextValid) {
      currentValidRef.current = nextValid;
      setIsValid(nextValid);
    }
  };

  const updateHintState = (nextHint) => {
    if (currentHintRef.current !== nextHint) {
      currentHintRef.current = nextHint;
      setHint(nextHint);
    }
  };

  // 1. Initialize PoseLandmarker once enabled
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function init() {
      try {
        const lm = await getPoseLandmarker();
        if (cancelled) return;
        landmarkerRef.current = lm;
        setIsReady(true);
        updateHintState("Step into the camera view");
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Failed to load pose model";
        console.error("usePoseValidation: Failed to get landmarker", err);
        setError(msg);
        updateHintState("Pose detection unavailable");
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // 2. Main detection & drawing loop
  useEffect(() => {
    if (!enabled || !isReady) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const minIntervalMs = 1000 / T.maxDetectionsPerSecond;

    const clearCanvas = () => {
      const canvas = canvasRef?.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    const loop = () => {
      if (cancelled) return;

      const video = videoRef?.current;
      const landmarker = landmarkerRef.current;
      const canvas = canvasRef?.current;

      const now = performance.now();

      if (
        video &&
        landmarker &&
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTimeRef.current &&
        now - lastDetectionTimeRef.current >= minIntervalMs
      ) {
        lastDetectionTimeRef.current = now;
        lastVideoTimeRef.current = video.currentTime;

        try {
          const result = landmarker.detectForVideo(video, now);
          const landmarks = result?.landmarks?.[0] || null;

          if (canvas) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }

          if (!landmarks || landmarks.length === 0) {
            // No person in frame
            clearCanvas();
            consecutiveInvalidRef.current += 1;
            consecutiveValidRef.current = 0;

            if (consecutiveInvalidRef.current >= T.failFramesToDrop) {
              updateValidState(false);
            }
            updateHintState("Step into the camera view");
          } else {
            // Person detected: run A-pose validator
            const validation = validateAPose(landmarks, {
              width: video.videoWidth,
              height: video.videoHeight,
            });

            if (validation.valid) {
              consecutiveValidRef.current += 1;
              consecutiveInvalidRef.current = 0;

              if (consecutiveValidRef.current >= T.stableFramesToPass) {
                updateValidState(true);
                updateHintState("Perfect, hold still");
              } else {
                updateHintState("Hold still...");
              }
            } else {
              consecutiveInvalidRef.current += 1;
              consecutiveValidRef.current = 0;

              if (consecutiveInvalidRef.current >= T.failFramesToDrop) {
                updateValidState(false);
              }
              const reason = validation.reasons[0] || "Step into the camera view";
              updateHintState(reason);
            }

            // Draw skeleton overlay
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const color = currentValidRef.current ? COLORS.valid : COLORS.invalid;
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
              }
            }
          }
        } catch (loopErr) {
          console.warn("Pose detection loop error:", loopErr);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelled = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
      clearCanvas();
    };
  }, [enabled, isReady, videoRef, canvasRef]);

  return { isValid, hint, isReady, error };
}

export default usePoseValidation;
