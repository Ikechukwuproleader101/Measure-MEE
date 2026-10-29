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

export interface GuideDefinition {
  viewBox: { w: number; h: number };
  bounds: { top: number; bottom: number; left: number; right: number };
  head?: string;
  body?: string;
  centerLine?: { x1: number; y1: number; x2: number; y2: number };
  joints: Record<string, [number, number]>;
  radii?: Record<string, number>;
}

export declare const GUIDE: GuideDefinition;
export declare const GUIDE_BUILTIN: GuideDefinition;

export interface FitConfig {
  radius: Record<string, number>;
  coreJoints: string[];
  allowedMisses: number;
  minVisibilityCore: number;
  smoothingAlpha: number;
  passHoldMs: number;
  failHoldMs: number;
  captureRadiusScale: number;
  captureGraceMs: number;
  countdownSeconds: number;
}

export declare const FIT_CONFIG: FitConfig;
export declare const AUTO_START_WHEN_GREEN: boolean;
