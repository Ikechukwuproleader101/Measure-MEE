export interface FitToGuideJointResult {
  name: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  radius: number;
  dist: number;
  ok: boolean;
}

export interface FitToGuideResult {
  pass: boolean;
  hint: string;
  ratio: number;
  dx: number;
  dy: number;
  scalePass?: boolean;
  centerPass?: boolean;
  corePass?: boolean;
  worstJoint?: { name: string; dist: number; maxDist: number; ratio?: number } | null;
  missedJoints?: string[];
  joints: FitToGuideJointResult[];
  size: {
    ratio: number;
    dx: number;
    dy: number;
  };
  _debug?: {
    worstJointName: string;
    worstRatio: number;
  };
}

export interface FitToGuideOptions {
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  placement: { k: number; tx: number; ty: number; cs: number };
  videoW: number;
  videoH: number;
  boxW: number;
  boxH: number;
  fit?: 'cover' | 'contain';
  mirrored?: boolean;
  radiusScale?: number;
  guide?: any;
  config?: any;
}

export declare function fitToGuide(options: FitToGuideOptions): FitToGuideResult;

export interface HoldTracker {
  update(pass: boolean, nowMs: number): boolean;
  isValid(): boolean;
  lastValidAtMs(): number;
  reset(): void;
}

export declare function createHoldTracker(options?: {
  passHoldMs?: number;
  failHoldMs?: number;
}): HoldTracker;

export declare function shouldCaptureAtZero(options: {
  isValid: boolean;
  lastValidAtMs: number;
  nowMs: number;
  graceMs?: number;
}): boolean;

export declare function smoothJoints(
  prev: Record<string, { x: number; y: number; visibility?: number }> | null,
  curr: Record<string, { x: number; y: number; visibility?: number }>,
  alpha?: number
): Record<string, { x: number; y: number; visibility?: number }>;

export declare function boxToArtwork(
  bx: number | { x: number; y: number },
  by?: number | any,
  placement?: any
): { x: number; y: number };

export declare function artworkToBox(
  ax: number | { x: number; y: number },
  ay?: number | any,
  placement?: any
): { x: number; y: number };
