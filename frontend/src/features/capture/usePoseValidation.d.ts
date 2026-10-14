import React from 'react';

export interface UsePoseValidationOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enabled?: boolean;
}

export interface UsePoseValidationResult {
  isValid: boolean;
  hint: string;
  isReady: boolean;
  error: string | null;
}

export declare function usePoseValidation(
  options: UsePoseValidationOptions
): UsePoseValidationResult;

export default usePoseValidation;
