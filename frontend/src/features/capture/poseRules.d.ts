export interface RangeWithBuffer {
  min: number;
  max: number;
  buffer?: number;
}

export declare const RULES: {
  tilt: {
    pitch: RangeWithBuffer;
    roll: RangeWithBuffer;
    veryTiltedPitch: number;
    shakeDegPerSec: number;
    noDataMs: number;
  };
  body: {
    minVisibility: number;
    frameMargin: number;
    heightFracMin: number;
    heightFracMax: number;
    centerOffsetMax: number;
  };
  arm: {
    angle: RangeWithBuffer;
    elbow: RangeWithBuffer;
  };
  leg: {
    knee: RangeWithBuffer;
    spread: RangeWithBuffer;
  };
  shoulders: {
    tilt: RangeWithBuffer;
  };
  torso: {
    lean: RangeWithBuffer;
  };
  smoothingAlpha: number;
  hold: {
    passMs: number;
    failMs: number;
  };
  capture: {
    countdownSeconds: number;
    rangeScale: number;
    graceMs: number;
    failsBeforeAnyway: number;
  };
  cues: {
    minGapMs: number;
    repeatMs: number;
  };
  TARGET_ARM_ANGLE: number;
  SHOW_TARGET_HINTS: boolean;
};

export declare const AUTO_START_WHEN_GREEN: boolean;

export declare function rangeCheck(
  value: number,
  range: RangeWithBuffer,
  wasOk?: boolean,
  scale?: number
): boolean;

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

export declare function smoothJoints<T>(
  prev: T | null,
  curr: T,
  alpha?: number
): T;

