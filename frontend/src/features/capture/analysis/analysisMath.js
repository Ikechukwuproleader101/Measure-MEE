/**
 * Pure functions for outline coverage, pixel height extraction, and scale calculations.
 */

/**
 * Calculates the ratio of body pixels (value === 1) to total pixels in the mask.
 *
 * @param {{ data: Uint8Array, width: number, height: number } | null | undefined} mask
 * @returns {{ coverage: number, valid: boolean }}
 */
export function calculateOutlineCoverage(mask) {
  if (!mask || !mask.data || mask.data.length === 0 || !mask.width || !mask.height) {
    return { coverage: 0, valid: false };
  }

  const total = mask.width * mask.height;
  let bodyCount = 0;
  const data = mask.data;
  for (let i = 0; i < total; i++) {
    if (data[i] === 1) {
      bodyCount++;
    }
  }

  const coverage = bodyCount / total;
  // Coverage between 5% (0.05) and 80% (0.80) is valid
  const valid = coverage >= 0.05 && coverage <= 0.80;

  return { coverage, valid };
}

/**
 * Finds the top-most and bottom-most rows containing body pixels (value === 1)
 * and returns the span in pixels. Returns 0 if no body pixels exist.
 *
 * @param {{ data: Uint8Array, width: number, height: number } | null | undefined} mask
 * @returns {number} pixelHeight
 */
export function calculateMaskPixelHeight(mask) {
  if (!mask || !mask.data || mask.data.length === 0 || !mask.width || !mask.height) {
    return 0;
  }

  const { data, width, height } = mask;
  let topRow = -1;
  let bottomRow = -1;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    let rowHasBody = false;
    for (let x = 0; x < width; x++) {
      if (data[rowOffset + x] === 1) {
        rowHasBody = true;
        break;
      }
    }
    if (rowHasBody) {
      if (topRow === -1) {
        topRow = y;
      }
      bottomRow = y;
    }
  }

  if (topRow === -1 || bottomRow === -1) {
    return 0;
  }

  return bottomRow - topRow + 1;
}

/**
 * Computes cm per pixel scale for a photo.
 * Fails if pixelHeight is under 40% (0.40) of the image height.
 *
 * @param {number} heightCm
 * @param {number} pixelHeight
 * @param {number} imageHeight
 * @returns {{ valid: boolean, cmPerPixel: number | null, error: string | null }}
 */
export function calculateScale(heightCm, pixelHeight, imageHeight) {
  if (!pixelHeight || pixelHeight <= 0 || !imageHeight || imageHeight <= 0) {
    return { valid: false, cmPerPixel: null, error: "No body detected in outline." };
  }

  const fraction = pixelHeight / imageHeight;
  if (fraction < 0.40) {
    return {
      valid: false,
      cmPerPixel: null,
      error: "Body height is less than 40% of the photo frame. Move closer to the camera.",
    };
  }

  const cmPerPixel = heightCm / pixelHeight;
  return { valid: true, cmPerPixel, error: null };
}
