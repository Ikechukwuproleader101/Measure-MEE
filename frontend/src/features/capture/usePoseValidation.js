import { useState, useEffect, useRef } from "react";
import { getPoseLandmarker } from "../../services/poseLandmarker.js";
import { THRESHOLDS as T, COLORS } from "./poseConstants.js";
import { RULES, createHoldTracker, smoothJoints } from "./poseRules.js";
import { evaluatePose } from "./evaluatePose.js";
import { useDeviceTilt } from "./useDeviceTilt.js";
import { drawLimbsOverlay } from "./limbRenderer.js";
import { playChime, playDistanceCue, cueDecision, cueFromHint } from "./cues.js";

/**
 * Hook for live pose validation using per-body-part evaluation and tilt gating.
 *
 * Runs MediaPipe on every frame, tracks phone tilt, evaluates each limb against
 * individual pass ranges using the person's own proportions, renders color-coded
 * lines to the canvas, and manages distance cues and countdown validation.
 */
export function usePoseValidation({
  videoRef,
  canvasRef,
  containerRef,
  enabled = true,
  validator,
  showSkeleton = false,
  viewMode = "front",
  mirrored = false,
  isCountdownActive = false,
}) {
  const [isValid, setIsValid] = useState(false);
  const [hint, setHint] = useState("Getting ready...");
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [personVisible, setPersonVisible] = useState(false);
  const [lastValidAtMs, setLastValidAtMs] = useState(0);
  const [parts, setParts] = useState({});
  const [metrics, setMetrics] = useState(null);

  const tilt = useDeviceTilt({ enabled });

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
  const prevPoseEvalRef = useRef(null);
  const lastCueRef = useRef(null);
  const lastCueTimeRef = useRef(0);

  const holdTrackerRef = useRef(
    createHoldTracker({
      passHoldMs: RULES.hold.passMs,
      failHoldMs: RULES.hold.failMs,
    })
  );

  // Reset trackers and smoothing when viewMode changes
  useEffect(() => {
    holdTrackerRef.current.reset();
    smoothedJointsRef.current = null;
    prevPoseEvalRef.current = null;
    lastCueRef.current = null;
    lastCueTimeRef.current = 0;
    setIsValid(false);
    currentValidRef.current = false;
    setPersonVisible(false);
    personVisibleRef.current = false;
    setParts({});
    setMetrics(null);
  }, [viewMode]);

  const updateValidState = (nextValid, now) => {
    if (currentValidRef.current !== nextValid) {
      if (!currentValidRef.current && nextValid) {
        // Transition from invalid -> valid: play chime!
        playChime();
        setLastValidAtMs(now);
      }
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
    return () => {
      cancelled = true;
    };
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
          const rawLandmarks = result?.landmarks?.[0] || null;

          const videoW = video.videoWidth || 720;
          const videoH = video.videoHeight || 1280;

          if (canvas) {
            if (canvas.width !== videoW || canvas.height !== videoH) {
              canvas.width = videoW;
              canvas.height = videoH;
            }
          }

          if (!rawLandmarks || rawLandmarks.length === 0) {
            // No person in camera view
            updatePersonVisibleState(false);
            clearCanvas();
            const holderValid = holdTrackerRef.current.update(false, now);
            updateValidState(holderValid, now);

            // Hint: tilt takes precedence if tilted, else step into view
            const noPersonHint = !tilt.ok ? tilt.hint : "Step into the camera view";
            updateHintState(noPersonHint);

            smoothedJointsRef.current = null;
            setParts({});
            setMetrics(null);
          } else {
            updatePersonVisibleState(true);

            if (viewMode === "front") {
              // Smooth landmarks exponentially
              smoothedJointsRef.current = smoothJoints(
                smoothedJointsRef.current,
                rawLandmarks,
                RULES.smoothingAlpha
              );
              const smoothedLandmarks = smoothedJointsRef.current || rawLandmarks;

              // Run pure pose evaluation
              const poseEval = evaluatePose({
                landmarks: smoothedLandmarks,
                videoW,
                videoH,
                mirrored,
                prev: prevPoseEvalRef.current,
                rangeScale: 1,
              });

              prevPoseEvalRef.current = poseEval.nextPrev;
              setMetrics(poseEval.metrics);

              // Tilt gating: tilt beats whole-body, which beats parts
              let effectivePass = false;
              let effectiveHint = "Step into the camera view";
              let displayedParts = poseEval.parts;

              if (!tilt.ok) {
                // Tilt gates the pose: limbs neutral, green cannot show, tilt message displayed
                effectivePass = false;
                effectiveHint = tilt.hint;
                displayedParts = Object.fromEntries(
                  Object.entries(poseEval.parts).map(([k, v]) => [
                    k,
                    { ...v, state: "neutral" },
                  ])
                );
              } else {
                effectivePass = poseEval.pass;
                effectiveHint = poseEval.hint;
                displayedParts = poseEval.parts;
              }

              setParts(displayedParts);

              // Update hold tracker (300ms continuous pass -> green)
              const holderValid = holdTrackerRef.current.update(effectivePass, now);
              updateValidState(holderValid, now);

              const activeDisplayHint = holderValid ? "Perfect, hold still" : effectiveHint;
              updateHintState(activeDisplayHint);

              // Audio distance cues (only when not in countdown and not valid)
              if (!isCountdownActive && !holderValid && tilt.ok) {
                const cue = cueFromHint(effectiveHint);
                if (
                  cue &&
                  cueDecision({
                    cue,
                    lastCue: lastCueRef.current,
                    lastPlayedAtMs: lastCueTimeRef.current,
                    nowMs: now,
                  })
                ) {
                  playDistanceCue(cue);
                  lastCueRef.current = cue;
                  lastCueTimeRef.current = now;
                }
              }

              // Draw color-coded limbs overlay
              if (canvas) {
                drawLimbsOverlay(canvas, {
                  landmarks: smoothedLandmarks,
                  parts: displayedParts,
                  metrics: poseEval.metrics,
                  videoW,
                  videoH,
                  wholeBodyOk: poseEval.wholeBody.ok,
                  tiltOk: tilt.ok,
                  showSkeleton,
                  showTargetHints: RULES.SHOW_TARGET_HINTS,
                });
              }
            } else {
              // Side view: legacy validator + tilt gating
              const currentValidator = validatorRef.current;
              let sideValid = false;
              let sideReason = "Step into the camera view";

              if (currentValidator) {
                const validation = currentValidator(rawLandmarks, {
                  width: videoW,
                  height: videoH,
                });
                sideValid = validation.valid;
                sideReason = validation.reasons?.[0] || "Step into the camera view";
              }

              let effectiveSidePass = false;
              let effectiveSideHint = sideReason;

              if (!tilt.ok) {
                effectiveSidePass = false;
                effectiveSideHint = tilt.hint;
              } else {
                effectiveSidePass = sideValid;
                effectiveSideHint = sideReason;
              }

              const holderValid = holdTrackerRef.current.update(effectiveSidePass, now);
              updateValidState(holderValid, now);

              const activeSideDisplayHint = holderValid ? "Perfect, hold still" : effectiveSideHint;
              updateHintState(activeSideDisplayHint);

              // Audio distance cues for side view
              if (!isCountdownActive && !holderValid && tilt.ok) {
                const cue = cueFromHint(effectiveSideHint);
                if (
                  cue &&
                  cueDecision({
                    cue,
                    lastCue: lastCueRef.current,
                    lastPlayedAtMs: lastCueTimeRef.current,
                    nowMs: now,
                  })
                ) {
                  playDistanceCue(cue);
                  lastCueRef.current = cue;
                  lastCueTimeRef.current = now;
                }
              }

              // Clear or draw skeleton
              if (canvas) {
                clearCanvas();
                if (showSkeleton) {
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.save();
                    ctx.strokeStyle = holderValid ? COLORS.valid : COLORS.invalid;
                    ctx.lineWidth = 2;
                    // Simple skeleton connection for side view
                    ctx.beginPath();
                    for (let i = 0; i < rawLandmarks.length; i++) {
                      const lm = rawLandmarks[i];
                      if ((lm.visibility ?? 0) > 0.4) {
                        ctx.arc(lm.x * videoW, lm.y * videoH, 3, 0, Math.PI * 2);
                      }
                    }
                    ctx.stroke();
                    ctx.restore();
                  }
                }
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
      updatePersonVisibleState(false);
    };
  }, [
    enabled,
    isReady,
    videoRef,
    canvasRef,
    containerRef,
    showSkeleton,
    viewMode,
    mirrored,
    tilt.ok,
    tilt.hint,
    isCountdownActive,
  ]);

  return {
    isValid,
    hint,
    isReady,
    error,
    personVisible,
    lastValidAtMs,
    parts,
    metrics,
    tilt,
  };
}

export default usePoseValidation;
