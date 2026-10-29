import type { GuideDefinition } from './poseConstants';

export declare const GUIDE_HEAD_PATH: string;
export declare const GUIDE_BODY_PATH: string;
export declare const GUIDE_CENTER_LINE: { x1: number; y1: number; x2: number; y2: number };

export interface PlaceGuideOptions {
  videoW: number;
  videoH: number;
  boxW: number;
  boxH: number;
  fit?: 'cover' | 'contain';
  guide?: GuideDefinition;
}

export interface PlaceGuideResult {
  k: number;
  tx: number;
  ty: number;
  cs: number;
}

export declare function placeGuide(
  optionsOrVideoW: PlaceGuideOptions | number,
  videoH?: number,
  boxW?: number,
  boxH?: number,
  fit?: 'cover' | 'contain',
  guide?: GuideDefinition
): PlaceGuideResult;

export declare function parsePoseDebug(
  locationOrString?: Location | string | null
): boolean;

export declare function shouldDrawSkeleton(showSkeleton?: boolean): boolean;

export declare function drawSkeletonOverlay(
  canvas: HTMLCanvasElement | null,
  landmarks: Array<any> | null,
  options?: { color?: string; showSkeleton?: boolean; fitResult?: any }
): boolean;
