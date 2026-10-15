import { CaptureResult } from "./captureSession";
import { PoseValidator } from "./usePoseValidation";

export interface AnalyzeCanvasOptions {
  canvas: HTMLCanvasElement;
  view: "front" | "side";
  validator?: PoseValidator;
  source?: "camera" | "upload";
}

export declare function analyzeCanvas(
  options: AnalyzeCanvasOptions
): Promise<CaptureResult | { error: string }>;

export interface CaptureFrameOptions {
  video: HTMLVideoElement;
  view: "front" | "side";
  validator?: PoseValidator;
}

export declare function captureFrame(
  options: CaptureFrameOptions
): Promise<CaptureResult | { error: string }>;

export interface ProcessUploadedImageOptions {
  file: File;
  view: "front" | "side";
  validator?: PoseValidator;
}

export declare function processUploadedImage(
  options: ProcessUploadedImageOptions
): Promise<CaptureResult | { error: string }>;
