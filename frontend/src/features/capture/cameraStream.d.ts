export interface FallbackOptions {
  facingMode: string;
  getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
  sleep?: (ms: number) => Promise<void>;
  retriesPerAttempt?: number;
  retryDelayMs?: number;
}

export interface AutoRetryOptions {
  videoWidth: number;
  readyState: number;
  retries: number;
  maxRetries?: number;
}

export declare function buildConstraintAttempts(facingMode: string): MediaStreamConstraints[];
export declare function isPermissionError(err: any): boolean;
export declare function getStreamWithFallback(options: FallbackOptions): Promise<MediaStream>;
export declare function shouldAutoRetry(options: AutoRetryOptions): boolean;

