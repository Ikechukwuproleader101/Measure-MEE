export interface DeviceTiltState {
  ok: boolean;
  state: string;
  hint: string | null;
  pitch: number;
  roll: number;
  shakeRate: number;
  hasData: boolean;
}

export declare function requestTiltPermission(): Promise<boolean>;

export declare function useDeviceTilt(options?: { enabled?: boolean }): DeviceTiltState;

