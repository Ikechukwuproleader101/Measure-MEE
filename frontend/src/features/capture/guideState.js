import { COLORS } from "./poseConstants.js";

/**
 * Pure function determining the silhouette guide and frame state.
 *
 * @param {Object} [params]
 * @param {boolean} [params.personVisible=false]
 * @param {boolean} [params.isValid=false]
 * @returns {"idle" | "invalid" | "valid"}
 */
export function guideState({ personVisible = false, isValid = false } = {}) {
  if (isValid) return "valid";
  if (personVisible) return "invalid";
  return "idle";
}

export const GUIDE_COLORS = {
  idle: "#ffffff",
  invalid: COLORS.invalid, // "#ef4444"
  valid: COLORS.valid,     // "#22c55e"
};

