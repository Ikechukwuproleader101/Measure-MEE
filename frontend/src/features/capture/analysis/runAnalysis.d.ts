import { CaptureResult } from "../captureSession";

export interface StageNotification {
  id: "photos" | "outline" | "scale" | "measure";
  state: "waiting" | "active" | "done" | "failed";
  detail?: string;
}

export interface RunAnalysisInput {
  heightCm: number;
  front: CaptureResult;
  side: CaptureResult;
}

export interface RunAnalysisOutput {
  ok: boolean;
  failedStage?: "photos" | "outline" | "scale" | "measure";
  error?: string;
  frontScale?: number;
  sideScale?: number;
  frontPixelHeight?: number;
  sidePixelHeight?: number;
  measurementsImplemented?: boolean;
  message?: string;
}

export declare const ANALYSIS_STAGES: Array<{ id: string; title: string }>;

export declare function runAnalysis(
  input: RunAnalysisInput,
  onStage?: (
    id: "photos" | "outline" | "scale" | "measure",
    state: "waiting" | "active" | "done" | "failed",
    detail?: string
  ) => void
): Promise<RunAnalysisOutput>;
