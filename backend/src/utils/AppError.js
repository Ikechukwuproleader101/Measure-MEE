export class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Application-specific error code string (e.g. 'VALIDATION_ERROR', 'UNAUTHORIZED')
   * @param {string} message - Human-readable error message
   */
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
