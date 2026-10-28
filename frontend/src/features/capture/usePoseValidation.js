import { useState, useEffect, useRef } from "react";
import { getPoseLandmarker } from "../../services/poseLandmarker.js";
import { THRESHOLDS as T, COLORS } from "./poseConstants.js";
import { validateAPose } from "./validateAPose.js";
import { drawSkeletonOverlay } from "./poseGuide.js";

/**
 * Hook for live A-pose validation, stability smoothing, and optional canvas skeleton overlay.
 *
 * @param {Object} params
 * @param {React.RefObject<HTMLVideoElement | null>} params.videoRef
 * @param {React.RefObject<HTMLCanvasElement | null>} params.canvasRef
 * @param {boolean} [params.enabled=true]
 * @param {Function} [params.validator=validateAPose]
 * @param {boolean} [params.showSkeleton=false]
 * @returns {{ isValid: boolean, hint: string, isReady: boolean, error: string | null, personVisible: boolean }}
 */
export function usePoseValidation({
  videoRef,
  canvasRef,
  enabled = true,
  validator = validateAPose,
  showSkeleton = false,
}) {
  const [isValid, setIsValid] = useState(false);
  const [hint, setHint] = useState("Getting ready...");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [personVisible, setPersonVisible] = useState(false);

  const validatorRef = useRef(validator);
  useEffect(() => {
    validatorRef.current = validator;
    consecutiveValidRef.current = 0;
    consecutiveInvalidRef.current = 0;
  }, [validator]);

  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const consecutiveValidRef = useRef(0);
  const consecutiveInvalidRef = useRef(0);
  const currentValidRef = useRef(false);
  const currentHintRef = useRef("Getting ready...");
  const personVisibleRef = useRef(false);
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

  const updatePersonVisibleState = (nextVisible) => {
    if (personVisibleRef.current !== nextVisible) {
      personVisibleRef.current = nextVisible;
      setPersonVisible(nextVisible);
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

  // 2. Main detection & optional drawing loop
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

          if (showSkeleton && canvas) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }

          if (!landmarks || landmarks.length === 0) {
            // No person in frame
            updatePersonVisibleState(false);
            if (showSkeleton) {
              clearCanvas();
            }
            consecutiveInvalidRef.current += 1;
            consecutiveValidRef.current = 0;

            if (consecutiveInvalidRef.current >= T.failFramesToDrop) {
              updateValidState(false);
            }
            updateHintState("Step into the camera view");
          } else {
            // Person detected: run validator
            updatePersonVisibleState(true);
            const currentValidator = validatorRef.current || validateAPose;
            const validation = currentValidator(landmarks, {
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

            // Draw skeleton overlay only if enabled by debug switch
            if (showSkeleton && canvas) {
              const color = currentValidRef.current ? COLORS.valid : COLORS.invalid;
              drawSkeletonOverlay(canvas, landmarks, {
                color,
                showSkeleton: true,
              });
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
      if (showSkeleton) {
        clearCanvas();
      }
      updatePersonVisibleState(false);
    };
  }, [enabled, isReady, videoRef, canvasRef, showSkeleton]);

  return { isValid, hint, isReady, error, personVisible };
}

export default usePoseValidation;
