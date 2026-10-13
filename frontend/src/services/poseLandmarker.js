import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let landmarkerInstance = null;
let landmarkerPromise = null;

/**
 * Creates or retrieves the singleton PoseLandmarker instance.
 * Serves WASM and model files locally from public directory.
 * Falls back to CPU delegate if GPU initialization fails.
 * 
 * @returns {Promise<PoseLandmarker>}
 */
export async function getPoseLandmarker() {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }

  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    try {
      // Resolve WASM binaries from local public assets
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

      // Attempt initialization with GPU acceleration
      try {
        landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn('MediaPipe GPU delegate failed, falling back to CPU:', gpuError);
        // Fallback to CPU delegate
        landmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      return landmarkerInstance;
    } catch (err) {
      console.error('Failed to initialize PoseLandmarker:', err);
      landmarkerPromise = null;
      throw err;
    }
  })();

  return landmarkerPromise;
}

/**
 * Safely closes and releases the PoseLandmarker instance.
 */
export async function closePoseLandmarker() {
  if (landmarkerInstance) {
    try {
      await landmarkerInstance.close();
    } catch (err) {
      console.warn('Error closing PoseLandmarker instance:', err);
    }
    landmarkerInstance = null;
  }
  landmarkerPromise = null;
}
