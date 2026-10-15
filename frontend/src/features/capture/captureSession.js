/**
 * In-memory Capture Session State & Reducer
 *
 * Flow: height -> prep -> hub -> camera (for one view) -> back to hub -> analyzing -> done
 * Front and side can be filled in either order via camera or upload.
 * Zero persistence outside memory.
 */

export const CAPTURE_STEPS = [
  "height",
  "prep",
  "hub",
  "camera",
  "analyzing",
  "done",
];

export const INITIAL_CAPTURE_STATE = {
  step: "height",
  heightCm: null,
  front: null,
  side: null,
  cameraView: null, // "front" | "side" | null
};

function safelyRevokeUrl(url) {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function" && url) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

/**
 * Pure reducer managing capture session state.
 *
 * @param {typeof INITIAL_CAPTURE_STATE} state
 * @param {Object} action
 * @returns {typeof INITIAL_CAPTURE_STATE}
 */
export function captureReducer(state = INITIAL_CAPTURE_STATE, action) {
  if (!action || !action.type) return state;

  switch (action.type) {
    case "SET_HEIGHT": {
      return {
        ...state,
        heightCm:
          typeof action.heightCm === "number"
            ? action.heightCm
            : Number(action.heightCm) || null,
      };
    }

    case "GO_TO": {
      const targetStep = action.step;
      if (!CAPTURE_STEPS.includes(targetStep)) {
        return state;
      }

      // analyzing & done require height, front, and side to be present
      if (
        (targetStep === "analyzing" || targetStep === "done") &&
        (state.heightCm === null || state.heightCm === undefined || !state.front || !state.side)
      ) {
        return state;
      }

      return {
        ...state,
        step: targetStep,
      };
    }

    case "START_CAMERA": {
      const view = action.view;
      if (view !== "front" && view !== "side") {
        return state;
      }
      return {
        ...state,
        cameraView: view,
        step: "camera",
      };
    }

    case "SET_CAPTURE": {
      const { view, result } = action;
      if (view !== "front" && view !== "side") {
        return state;
      }
      // If replacing an existing capture with a different preview URL, revoke the old one
      if (state[view]?.previewUrl && state[view].previewUrl !== result?.previewUrl) {
        safelyRevokeUrl(state[view].previewUrl);
      }
      return {
        ...state,
        [view]: result,
        cameraView: null,
        step: "hub",
      };
    }

    case "CANCEL_CAMERA": {
      return {
        ...state,
        cameraView: null,
        step: "hub",
      };
    }

    case "CLEAR_CAPTURE": {
      const view = action.view;
      if (view !== "front" && view !== "side") {
        return state;
      }
      if (state[view]?.previewUrl) {
        safelyRevokeUrl(state[view].previewUrl);
      }
      return {
        ...state,
        [view]: null,
      };
    }

    case "START_ANALYSIS": {
      if (
        state.heightCm === null ||
        state.heightCm === undefined ||
        !state.front ||
        !state.side
      ) {
        return state;
      }
      return {
        ...state,
        step: "analyzing",
      };
    }

    case "RESET": {
      if (state.front?.previewUrl) {
        safelyRevokeUrl(state.front.previewUrl);
      }
      if (state.side?.previewUrl) {
        safelyRevokeUrl(state.side.previewUrl);
      }
      return {
        ...INITIAL_CAPTURE_STATE,
      };
    }

    default:
      return state;
  }
}

// Action Creators
export const setHeightAction = (heightCm) => ({ type: "SET_HEIGHT", heightCm });
export const goToStepAction = (step) => ({ type: "GO_TO", step });
export const startCameraAction = (view) => ({ type: "START_CAMERA", view });
export const setCaptureAction = (view, result) => ({ type: "SET_CAPTURE", view, result });
export const cancelCameraAction = () => ({ type: "CANCEL_CAMERA" });
export const clearCaptureAction = (view) => ({ type: "CLEAR_CAPTURE", view });
export const startAnalysisAction = () => ({ type: "START_ANALYSIS" });
export const resetAction = () => ({ type: "RESET" });
