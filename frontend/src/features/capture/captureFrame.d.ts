import { CaptureResult } from "./captureSession";
import { PoseValidator } from "./usePoseValidation";

export interface CaptureFrameOptions {
  video: HTMLVideoElement;
  view: "front" | "side";
  validator?: PoseValidator;
}

export declare function captureFrame(
  options: CaptureFrameOptions
): Promise<CaptureResult | { error: string }>;
