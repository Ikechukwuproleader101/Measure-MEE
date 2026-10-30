import React from 'react';

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
  isCountdownActive?: boolean;
}

export interface UsePoseValidationResult {
  isValid: boolean;
  hint: string;
  isReady: boolean;
  error: string | null;
  personVisible: boolean;
  lastValidAtMs: number;
  parts: Record<string, { state: 'ok' | 'bad' | 'unseen' | 'neutral' }>;
  metrics: any;
  tilt: {
    ok: boolean;
    state: string;
    hint: string | null;
    pitch: number;
    roll: number;
    shakeRate: number;
    hasData: boolean;
  };
  fitResult?: any;
}

export declare function usePoseValidation(
  options: UsePoseValidationOptions
): UsePoseValidationResult;

export default usePoseValidation;
