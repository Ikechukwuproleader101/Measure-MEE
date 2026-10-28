export declare const GUIDE_VIEWBOX: { w: number; h: number };

export declare const GUIDE_HEAD: { cx: number; cy: number; r: number };
export declare const GUIDE_BODY_PATH: string;

export declare const GUIDE_KEYPOINTS: {
  nose: [number, number];
  leftShoulder: [number, number];
  rightShoulder: [number, number];
  leftElbow: [number, number];
  rightElbow: [number, number];
  leftWrist: [number, number];
  rightWrist: [number, number];
  leftHip: [number, number];
  rightHip: [number, number];
  leftAnkle: [number, number];
  rightAnkle: [number, number];
};

export declare const GUIDE_NOSE_TO_ANKLE: number;
export declare const GUIDE_FIGURE_BOUNDS: { top: number; bottom: number; left: number; right: number };

export interface PlaceGuideOptions {
  videoW: number;
  videoH: number;
  boxW: number;
  boxH: number;
  fit?: 'cover' | 'contain';
}

export interface PlaceGuideResult {
  k: number;
  tx: number;
  ty: number;
  fActual: number;
  warning: boolean;
  transform: string;
}

export declare function placeGuide(
  optionsOrVideoW: PlaceGuideOptions | number,
  videoH?: number,
  boxW?: number,
  boxH?: number,
  fit?: 'cover' | 'contain'
): PlaceGuideResult;

export declare function parsePoseDebug(
  locationOrString?: Location | string | null
): boolean;

export declare function shouldDrawSkeleton(showSkeleton?: boolean): boolean;

export declare function drawSkeletonOverlay(
  canvas: HTMLCanvasElement | null,
  landmarks: Array<any> | null,
  options?: { color?: string; showSkeleton?: boolean }
): boolean;

