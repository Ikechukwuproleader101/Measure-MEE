export declare const HEIGHT_MIN: number;
export declare const HEIGHT_MAX: number;

export interface HeightValidationResult {
  valid: boolean;
  heightCm: number | null;
  error: string | null;
}

export declare function validateHeight(
  value: string | number | null | undefined
): HeightValidationResult;
