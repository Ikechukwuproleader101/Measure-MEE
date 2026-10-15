/**
 * In-memory Capture Session State & Reducer
 *
 * Enforces workflow state transitions and stores captured frames in RAM.
 * Nothing is persisted to localStorage, cookies, or remote network.
 */

export const CAPTURE_STEPS = [
  "height",
  "prep",
  "front",
  "reviewFront",
  "side",
  "reviewSide",
  "done",
];

export const INITIAL_CAPTURE_STATE = {
  step: "height",
  heightCm: null,
  front: null,
  side: null,
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
        heightCm: typeof action.heightCm === "number" ? action.heightCm : Number(action.heightCm) || null,
      };
    }

    case "GO_TO": {
      const targetStep = action.step;
      if (!CAPTURE_STEPS.includes(targetStep)) {
        return state;
      }

      // Rule: front must exist before side can start or be reviewed
      if ((targetStep === "side" || targetStep === "reviewSide") && !state.front) {
        return state;
      }

      // Rule: done is only reachable when heightCm, front, and side are all present
      if (
        targetStep === "done" &&
        (state.heightCm === null || state.heightCm === undefined || !state.front || !state.side)
      ) {
        return state;
      }

      return {
        ...state,
        step: targetStep,
      };
    }

    case "SET_CAPTURE": {
      const { view, result } = action;
      if (view !== "front" && view !== "side") {
        return state;
      }
      return {
        ...state,
        [view]: result,
      };
    }

    case "RETAKE": {
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
        step: view,
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
export const setCaptureAction = (view, result) => ({ type: "SET_CAPTURE", view, result });
export const retakeAction = (view) => ({ type: "RETAKE", view });
export const resetAction = () => ({ type: "RESET" });
