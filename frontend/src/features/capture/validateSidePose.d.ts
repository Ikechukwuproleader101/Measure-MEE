export interface PoseValidationResult {
  valid: boolean;
  reasons: string[];
}

export declare function validateSidePose(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  options?: { width?: number; height?: number }
): PoseValidationResult;
