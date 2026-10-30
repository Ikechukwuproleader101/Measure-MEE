export declare function isAudioMuted(): boolean;
export declare function setAudioMuted(muted: boolean): void;
export declare function unlockAudio(): void;

export declare function cueDecision(params: {
  cue: 'closer' | 'further' | null;
  lastCue?: 'closer' | 'further' | null;
  lastPlayedAtMs?: number;
  nowMs?: number;
}): boolean;

export declare function cueFromHint(hint: string | null): 'closer' | 'further' | null;
export declare function playChime(): void;
export declare function playDistanceCue(type: 'closer' | 'further'): void;

