export declare const MAX_FILE_SIZE_BYTES: number;
export declare const ALLOWED_MIME_TYPES: string[];
export declare const ALLOWED_EXTENSIONS: string[];

export interface UploadValidationResult {
  valid: boolean;
  error: string | null;
}

export declare function validateUploadFile(
  file: File | { name?: string; type?: string; size?: number } | null | undefined
): UploadValidationResult;
