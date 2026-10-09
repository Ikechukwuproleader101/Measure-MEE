import { AppError } from '../utils/AppError.js';

/**
 * Middleware factory for validating incoming request body, query, or params with Zod schemas.
 *
 * @param {Object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
export const validate = ({ body, query, params } = {}) => (req, _res, next) => {
  try {
    if (body) {
      req.body = body.parse(req.body);
    }
    if (query) {
      req.query = query.parse(req.query);
    }
    if (params) {
      req.params = params.parse(req.params);
    }
    next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const formatted = err.issues
        .map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`)
        .join('; ');
      return next(new AppError(400, 'VALIDATION_ERROR', formatted));
    }
    next(err);
  }
};
