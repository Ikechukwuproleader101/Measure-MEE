/**
 * Higher-order function that wraps async Express route handlers.
 * Catches any rejected promises and forwards them to next(error).
 *
 * @param {Function} fn - Async express route handler (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
