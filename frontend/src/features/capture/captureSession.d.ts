export interface CaptureResult {
  view: "front" | "side";
  source: "camera" | "upload";
  imageBlob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
  worldLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
  mask: { data: Uint8Array; width: number; height: number } | null;
  capturedAt: number;
  valid?: boolean;
  validationError?: string | null;
  verified?: boolean;
}

export type CaptureStep =
  | "height"
  | "prep"
  | "hub"
  | "camera"
  | "analyzing"
  | "done";

export interface CaptureSessionState {
  step: CaptureStep;
  heightCm: number | null;
  front: CaptureResult | null;
  side: CaptureResult | null;
  cameraView: "front" | "side" | null;
}

export type CaptureAction =
  | { type: "SET_HEIGHT"; heightCm: number }
  | { type: "GO_TO"; step: CaptureStep }
  | { type: "START_CAMERA"; view: "front" | "side" }
  | { type: "SET_CAPTURE"; view: "front" | "side"; result: CaptureResult }
  | { type: "CANCEL_CAMERA" }
  | { type: "CLEAR_CAPTURE"; view: "front" | "side" }
  | { type: "START_ANALYSIS" }
  | { type: "RESET" };

export declare const CAPTURE_STEPS: CaptureStep[];
export declare const INITIAL_CAPTURE_STATE: CaptureSessionState;
export declare function captureReducer(
  state: CaptureSessionState,
  action: CaptureAction
): CaptureSessionState;

export declare function setHeightAction(heightCm: number): CaptureAction;
export declare function goToStepAction(step: CaptureStep): CaptureAction;
export declare function startCameraAction(view: "front" | "side"): CaptureAction;
export declare function setCaptureAction(
  view: "front" | "side",
  result: CaptureResult
): CaptureAction;
export declare function cancelCameraAction(): CaptureAction;
export declare function clearCaptureAction(view: "front" | "side"): CaptureAction;
export declare function startAnalysisAction(): CaptureAction;
export declare function resetAction(): CaptureAction;
