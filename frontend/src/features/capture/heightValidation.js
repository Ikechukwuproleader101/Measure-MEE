export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 230;

/**
 * Validates height entry in centimeters.
 * Accepts numeric values in the range [100, 230].
 * Rejects empty, non-numeric, or out-of-range values.
 *
 * @param {string | number | null | undefined} value
 * @returns {{ valid: boolean, heightCm: number | null, error: string | null }}
 */
export function validateHeight(value) {
  if (value === null || value === undefined) {
    return { valid: false, heightCm: null, error: "Please enter your height" };
  }

  const str = String(value).trim();
  if (str === "") {
    return { valid: false, heightCm: null, error: "Please enter your height" };
  }

  const num = Number(str);
  if (!Number.isFinite(num) || isNaN(num)) {
    return { valid: false, heightCm: null, error: "Please enter a valid numeric height" };
  }

  if (num < HEIGHT_MIN || num > HEIGHT_MAX) {
    return {
      valid: false,
      heightCm: null,
      error: `Height must be between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm`,
    };
  }

  return { valid: true, heightCm: num, error: null };
}
