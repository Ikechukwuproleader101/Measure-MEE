export interface EvaluatePoseParams {
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  videoW: number;
  videoH: number;
  mirrored?: boolean;
  prev?: any;
  rangeScale?: number;
}

export interface EvaluatePoseResult {
  personVisible: boolean;
  wholeBody: {
    ok: boolean;
    hint: string | null;
    cue: 'closer' | 'further' | null;
  };
  parts: Record<
    string,
    {
      state: 'ok' | 'bad' | 'unseen' | 'neutral';
      reason?: string;
    }
  >;
  metrics: any;
  pass: boolean;
  hint: string;
  nextPrev: any;
}

export declare function evaluatePose(params: EvaluatePoseParams): EvaluatePoseResult;

