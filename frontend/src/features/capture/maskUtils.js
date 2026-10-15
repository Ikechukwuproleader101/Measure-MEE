/**
 * Converts float mask probabilities into a binary Uint8Array.
 * Values strictly greater than 0.5 become 1, otherwise 0.
 * Preserves the length and returns a Uint8Array.
 *
 * @param {Float32Array | Array<number> | ArrayLike<number>} floatArray
 * @returns {Uint8Array}
 */
export function convertFloatMaskToBinary(floatArray) {
  if (!floatArray) return new Uint8Array(0);
  const len = floatArray.length;
  const data = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    data[i] = floatArray[i] > 0.5 ? 1 : 0;
  }
  return data;
}

/**
 * Processes a MediaPipe MPMask object into a compact { data, width, height } object
 * and frees the underlying WASM memory by calling .close().
 *
 * @param {any} segmentationMask
 * @returns {{ data: Uint8Array, width: number, height: number } | null}
 */
export function processSegmentationMask(segmentationMask) {
  if (!segmentationMask) return null;
  try {
    const f = segmentationMask.getAsFloat32Array();
    const data = convertFloatMaskToBinary(f);
    return {
      data,
      width: segmentationMask.width,
      height: segmentationMask.height,
    };
  } finally {
    if (typeof segmentationMask.close === "function") {
      try {
        segmentationMask.close();
      } catch (err) {
        console.warn("Failed to close segmentation mask:", err);
      }
    }
  }
}
