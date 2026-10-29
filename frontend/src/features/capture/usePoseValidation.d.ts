import React from 'react';
import type { FitToGuideResult } from './fitToGuide';

export type PoseValidator = (
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  options?: { width?: number; height?: number }
) => { valid: boolean; reasons: string[] };

export interface UsePoseValidationOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef?: React.RefObject<HTMLElement | null>;
  enabled?: boolean;
  validator?: PoseValidator;
  showSkeleton?: boolean;
  viewMode?: 'front' | 'side';
  mirrored?: boolean;
}

export interface UsePoseValidationResult {
  isValid: boolean;
  hint: string;
  isReady: boolean;
  error: string | null;
  personVisible: boolean;
  lastValidAtMs: number;
  fitResult: FitToGuideResult | null;
}

export declare function usePoseValidation(
  options: UsePoseValidationOptions
): UsePoseValidationResult;

export default usePoseValidation;
