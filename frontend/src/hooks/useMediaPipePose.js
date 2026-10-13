import { useState, useEffect, useRef } from 'react';
import { getPoseLandmarker } from '../services/poseLandmarker';
import { validatePoseByMode, THRESHOLDS } from '../utils/poseValidation';

/**
 * Custom React Hook for real-time on-device MediaPipe Pose detection & validation.
 * 
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to the HTML5 video element
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Whether pose detection is active
 * @param {'front' | 'side'} [options.viewMode='front'] - Current capture view mode
 * @param {number} [options.fps=15] - Target detection frame rate limit (e.g., 15 fps)
 * @returns {{
 *   isReady: boolean,
 *   isLoading: boolean,
 *   isValid: boolean,
 *   reasons: string[],
 *   landmarks: Array<any> | null,
 *   metrics: Record<string, any>,
 *   stabilityProgress: number,
 *   error: string | null
 * }}
 */
export function useMediaPipePose(videoRef, { enabled = true, viewMode = 'front', fps = 15 } = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [reasons, setReasons] = useState(['Aligning pose...']);
  const [landmarks, setLandmarks] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [stabilityProgress, setStabilityProgress] = useState(0);
  const [error, setError] = useState(null);

  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const consecutiveValidRef = useRef(0);
  const consecutiveInvalidRef = useRef(0);
  const currentValidStateRef = useRef(false);

  const frameIntervalMs = 1000 / fps;

  // Initialize MediaPipe PoseLandmarker singleton
  useEffect(() => {
    let isCancelled = false;

    async function initModel() {
      setIsLoading(true);
      setError(null);

      try {
        const landmarker = await getPoseLandmarker();
        if (!isCancelled) {
          landmarkerRef.current = landmarker;
          setIsReady(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load pose model';
          console.error('PoseLandmarker initialization error:', err);
          setError(msg);
          setIsLoading(false);
        }
      }
    }

    initModel();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Reset stability counters when viewMode changes
  useEffect(() => {
    consecutiveValidRef.current = 0;
    consecutiveInvalidRef.current = 0;
    currentValidStateRef.current = false;
    setIsValid(false);
    setStabilityProgress(0);
    setReasons([viewMode === 'front' ? 'Stand in front-facing A-pose' : 'Turn 90° for side profile']);
  }, [viewMode]);

  // Main Detection Loop (requestAnimationFrame with FPS throttle)
  useEffect(() => {
    if (!enabled || !isReady) {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      return;
    }

    let isRunning = true;

    const processFrame = (timestamp) => {
      if (!isRunning) return;

      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      // Throttle detections to target fps
      if (timestamp - lastTimeRef.current >= frameIntervalMs) {
        if (
          video &&
          landmarker &&
          video.readyState >= 2 &&
          !video.paused &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        ) {
          lastTimeRef.current = timestamp;

          try {
            const result = landmarker.detectForVideo(video, timestamp);
            const detectedLandmarks = result?.landmarks?.[0] || null;

            if (detectedLandmarks && detectedLandmarks.length > 0) {
              setLandmarks(detectedLandmarks);

              // Validate pose against current viewMode rules
              const validation = validatePoseByMode(detectedLandmarks, viewMode);
              setMetrics(validation.metrics || {});

              if (validation.valid) {
                consecutiveValidRef.current += 1;
                consecutiveInvalidRef.current = 0;

                const progress = Math.min(1, consecutiveValidRef.current / THRESHOLDS.stableFramesToPass);
                setStabilityProgress(progress);

                // Reached required stability to turn valid / green
                if (consecutiveValidRef.current >= THRESHOLDS.stableFramesToPass) {
                  if (!currentValidStateRef.current) {
                    currentValidStateRef.current = true;
                    setIsValid(true);
                  }
                  setReasons([]);
                } else {
                  setReasons(['Hold still...']);
                }
              } else {
                consecutiveInvalidRef.current += 1;
                consecutiveValidRef.current = 0;
                setStabilityProgress(0);

                // Reached consecutive fails to drop back to invalid
                if (consecutiveInvalidRef.current >= THRESHOLDS.failFramesToDrop) {
                  if (currentValidStateRef.current) {
                    currentValidStateRef.current = false;
                    setIsValid(false);
                  }
                  setReasons(validation.reasons);
                }
              }
            } else {
              // No person detected in this frame
              consecutiveInvalidRef.current += 1;
              consecutiveValidRef.current = 0;
              setStabilityProgress(0);

              if (consecutiveInvalidRef.current >= THRESHOLDS.failFramesToDrop) {
                if (currentValidStateRef.current) {
                  currentValidStateRef.current = false;
                  setIsValid(false);
                }
                setLandmarks(null);
                setReasons(['Step into camera view']);
              }
            }
          } catch (detectionErr) {
            console.warn('MediaPipe detection frame warning:', detectionErr);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, isReady, viewMode, frameIntervalMs, videoRef]);

  return {
    isReady,
    isLoading,
    isValid,
    reasons,
    landmarks,
    metrics,
    stabilityProgress,
    error,
  };
}

export default useMediaPipePose;
