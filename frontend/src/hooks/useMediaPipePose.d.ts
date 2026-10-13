import React from 'react';

export interface UseMediaPipePoseOptions {
  enabled?: boolean;
  viewMode?: 'front' | 'side';
  fps?: number;
}

export interface UseMediaPipePoseReturn {
  isReady: boolean;
  isLoading: boolean;
  isValid: boolean;
  reasons: string[];
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }> | null;
  metrics: Record<string, any>;
  stabilityProgress: number;
  error: string | null;
}

export declare function useMediaPipePose(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options?: UseMediaPipePoseOptions
): UseMediaPipePoseReturn;

export default useMediaPipePose;
