import { AppError } from '../utils/AppError.js';

/**
 * 404 Not Found catch-all handler.
 */
export const notFound = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}`));
};
