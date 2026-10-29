import { useState, useEffect, useRef } from "react";
import { getPoseLandmarker } from "../../services/poseLandmarker.js";
import { THRESHOLDS as T, COLORS, GUIDE, FIT_CONFIG, IDX } from "./poseConstants.js";
import { placeGuide, drawSkeletonOverlay } from "./poseGuide.js";
import { fitToGuide, createHoldTracker, smoothJoints } from "./fitToGuide.js";

const JOINT_NAMES = [
  "nose",
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
  "leftAnkle", "rightAnkle",
];

/**
 * Hook for live pose validation using the fit-to-guide rule.
 *
 * Runs MediaPipe on every frame, maps landmarks to screen space,
 * compares against the silhouette guide's joint targets, and exposes
 * { isValid, hint, isReady, error, personVisible, lastValidAtMs, fitResult }.
 *
 * The old validator prop is kept for the side view (which still uses validateSidePose).
 * For the front view, fitToGuide is used instead.
 */
export function usePoseValidation({
  videoRef,
  canvasRef,
  containerRef,
  enabled = true,
  validator,
  showSkeleton = false,
  viewMode = "front",
}) {
  const [isValid, setIsValid] = useState(false);
  const [hint, setHint] = useState("Getting ready...");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [personVisible, setPersonVisible] = useState(false);
  const [lastValidAtMs, setLastValidAtMs] = useState(0);
  const [fitResult, setFitResult] = useState(null);

  const validatorRef = useRef(validator);
  useEffect(() => {
    validatorRef.current = validator;
  }, [validator]);

  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const currentValidRef = useRef(false);
  const currentHintRef = useRef("Getting ready...");
  const personVisibleRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const smoothedJointsRef = useRef(null);
  const holdTrackerRef = useRef(createHoldTracker({
    passHoldMs: FIT_CONFIG.passHoldMs,
    failHoldMs: FIT_CONFIG.failHoldMs,
  }));

  // Reset hold tracker when viewMode changes
  useEffect(() => {
    holdTrackerRef.current.reset();
    smoothedJointsRef.current = null;
    setIsValid(false);
    currentValidRef.current = false;
    setPersonVisible(false);
    personVisibleRef.current = false;
  }, [viewMode]);

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

  // 1. Initialize PoseLandmarker
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
    return () => { cancelled = true; };
  }, [enabled]);

  // 2. Main detection loop
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
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
            // No person
            updatePersonVisibleState(false);
            if (showSkeleton) clearCanvas();
            const holderValid = holdTrackerRef.current.update(false, now);
            updateValidState(holderValid);
            updateHintState("Step into the camera view");
            smoothedJointsRef.current = null;
          } else {
            updatePersonVisibleState(true);

            if (viewMode === "front") {
              // Fit-to-guide for front view
              const container = containerRef?.current;
              const boxW = container?.clientWidth || video.videoWidth;
              const boxH = container?.clientHeight || video.videoHeight;
              const videoW = video.videoWidth;
              const videoH = video.videoHeight;

              if (showSkeleton && canvas) {
                if (canvas.width !== boxW || canvas.height !== boxH) {
                  canvas.width = boxW;
                  canvas.height = boxH;
                }
              }

              const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover" });

              // Extract raw joint positions in box pixels for smoothing
              const cs = placement.cs;
              const rawJoints = {};
              for (const name of JOINT_NAMES) {
                const idx = IDX[name];
                const lm = landmarks[idx];
                if (!lm) continue;
                let bx = boxW / 2 + (lm.x - 0.5) * videoW * cs;
                const by = boxH / 2 + (lm.y - 0.5) * videoH * cs;
                rawJoints[name] = { x: bx, y: by, visibility: lm.visibility ?? 0 };
              }

              // Smooth
              smoothedJointsRef.current = smoothJoints(
                smoothedJointsRef.current,
                rawJoints,
                FIT_CONFIG.smoothingAlpha
              );

              // Build smoothed landmarks array for fitToGuide (put smoothed back into normalized)
              const smoothedLandmarks = [...landmarks];
              for (const name of JOINT_NAMES) {
                const idx = IDX[name];
                const sj = smoothedJointsRef.current[name];
                if (sj) {
                  const u = 0.5 + (sj.x - boxW / 2) / (videoW * cs);
                  const v = 0.5 + (sj.y - boxH / 2) / (videoH * cs);
                  smoothedLandmarks[idx] = {
                    ...landmarks[idx],
                    x: u,
                    y: v,
                  };
                }
              }

              const fit = fitToGuide({
                landmarks: smoothedLandmarks,
                placement,
                videoW,
                videoH,
                boxW,
                boxH,
                fit: "cover",
                mirrored: false,
                guide: GUIDE,
              });

              setFitResult(fit);

              const holderValid = holdTrackerRef.current.update(fit.pass, now);
              updateValidState(holderValid);
              if (holderValid) {
                setLastValidAtMs(now);
              }
              updateHintState(holderValid ? "Perfect, hold still" : fit.hint);

              // Draw debug skeleton overlay
              if (showSkeleton && canvas) {
                const color = currentValidRef.current ? COLORS.valid : COLORS.invalid;
                drawSkeletonOverlay(canvas, landmarks, { color, showSkeleton: true, fitResult: fit });
              }
            } else {
              // Side view: use the old validator
              if (showSkeleton && canvas) {
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                }
              }

              const currentValidator = validatorRef.current;
              if (currentValidator) {
                const validation = currentValidator(landmarks, {
                  width: video.videoWidth,
                  height: video.videoHeight,
                });

                const holderValid = holdTrackerRef.current.update(validation.valid, now);
                updateValidState(holderValid);
                if (holderValid) setLastValidAtMs(now);
                const reason = validation.reasons?.[0] || "Step into the camera view";
                updateHintState(holderValid ? "Perfect, hold still" : reason);
              }

              // Draw skeleton overlay only in debug mode
              if (showSkeleton && canvas) {
                const color = currentValidRef.current ? COLORS.valid : COLORS.invalid;
                drawSkeletonOverlay(canvas, landmarks, { color, showSkeleton: true });
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
      if (showSkeleton) clearCanvas();
      updatePersonVisibleState(false);
    };
  }, [enabled, isReady, videoRef, canvasRef, containerRef, showSkeleton, viewMode]);

  return { isValid, hint, isReady, error, personVisible, lastValidAtMs, fitResult };
}

export default usePoseValidation;
