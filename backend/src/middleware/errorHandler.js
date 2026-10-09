import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Centralized express error handler.
 * Formats all errors into consistent `{ error: { code, message } }` payload.
 */
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
    code = err.code || 'BAD_REQUEST';
    message = err.message;
  } else {
    // Unexpected error - log internally without exposing internal details in production
    console.error('Unhandled server error:', err);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(env.NODE_ENV === 'development' && !(err instanceof AppError)
        ? { stack: err.stack }
        : {}),
    },
  });
};
