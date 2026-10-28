export type GuideStateType = 'idle' | 'invalid' | 'valid';

export interface GuideStateParams {
  personVisible?: boolean;
  isValid?: boolean;
}

export declare function guideState(params?: GuideStateParams): GuideStateType;

export declare const GUIDE_COLORS: {
  idle: string;
  invalid: string;
  valid: string;
};

