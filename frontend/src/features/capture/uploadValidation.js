export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Validates an uploaded file before decoding.
 * Accepts JPG, PNG, and WebP up to 15 MB.
 * Rejects wrong types with: "Please choose a JPG or PNG photo."
 * Rejects oversized files with: "That photo is too large. Choose one under 15 MB."
 *
 * @param {File | { name?: string, type?: string, size?: number } | null | undefined} file
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const mime = file.type ? file.type.toLowerCase() : "";
  const name = file.name ? file.name.toLowerCase() : "";

  const hasValidMime = ALLOWED_MIME_TYPES.includes(mime);
  const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));

  if (!hasValidMime && !hasValidExt) {
    return { valid: false, error: "Please choose a JPG or PNG photo." };
  }

  if (typeof file.size === "number" && file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "That photo is too large. Choose one under 15 MB.",
    };
  }

  return { valid: true, error: null };
}
