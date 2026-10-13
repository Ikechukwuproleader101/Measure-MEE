import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

let landmarkerInstance = null;
let landmarkerPromise = null;
let currentDelegate = 'GPU';

/**
 * Sets the default delegate ('GPU' or 'CPU') and invalidates existing instance if changed.
 * @param {'GPU' | 'CPU'} delegate
 */
export function setPoseLandmarkerDelegate(delegate) {
  if (currentDelegate !== delegate) {
    currentDelegate = delegate;
    if (landmarkerInstance) {
      try {
        landmarkerInstance.close();
      } catch (err) {
        console.warn('Error closing PoseLandmarker instance on delegate switch:', err);
      }
      landmarkerInstance = null;
      landmarkerPromise = null;
    }
  }
}

/**
 * Creates or retrieves the singleton PoseLandmarker instance.
 * Serves WASM and model files locally from public directory.
 * Falls back to CPU delegate if GPU initialization fails.
 * 
 * @param {Object} [options]
 * @param {'GPU' | 'CPU'} [options.delegate] - Optional delegate override ('GPU' or 'CPU')
 * @returns {Promise<PoseLandmarker>}
 */
export async function getPoseLandmarker(options = {}) {
  const targetDelegate = options.delegate || currentDelegate;

  if (landmarkerInstance && currentDelegate === targetDelegate) {
    return landmarkerInstance;
  }

  // If a different delegate is explicitly requested, close existing instance
  if (landmarkerInstance && currentDelegate !== targetDelegate) {
    try {
      await landmarkerInstance.close();
    } catch (e) {
      console.warn('Error closing previous PoseLandmarker instance:', e);
    }
    landmarkerInstance = null;
    landmarkerPromise = null;
    currentDelegate = targetDelegate;
  }

  if (landmarkerPromise) {
    return landmarkerPromise;
  }

  landmarkerPromise = (async () => {
    try {
      // Resolve WASM binaries from local public assets
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

      if (targetDelegate === 'CPU') {
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
      } else {
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
          currentDelegate = 'CPU';
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
