export interface PoseValidationResult {
  valid: boolean;
  reasons: string[];
}

export declare function validateAPose(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>,
  options?: { width?: number; height?: number }
): PoseValidationResult;
