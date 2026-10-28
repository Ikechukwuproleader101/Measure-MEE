export declare const IDX: {
  nose: number;
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  leftWrist: number;
  rightWrist: number;
  leftHip: number;
  rightHip: number;
  leftKnee: number;
  rightKnee: number;
  leftAnkle: number;
  rightAnkle: number;
};

export declare const THRESHOLDS: Record<string, number>;
export declare const SIDE_THRESHOLDS: Record<string, number>;
export declare const COUNTDOWN_SECONDS: number;

export declare const COLORS: {
  valid: string;
  invalid: string;
  none: string;
};

export declare function guideState(params?: {
  personVisible?: boolean;
  isValid?: boolean;
}): 'idle' | 'invalid' | 'valid';

