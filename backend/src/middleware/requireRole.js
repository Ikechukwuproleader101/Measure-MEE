import { AppError } from '../utils/AppError.js';

/**
 * Role-based authorization guard middleware.
 * Verifies that the authenticated user possesses the required role.
 *
 * CRITICAL SECURITY RULE:
 * Always reads from req.user.app_metadata.role (which can only be modified by
 * the server or admin via service role). Never trust user_metadata as it is client-writable.
 *
 * @param {string} role - Role required to access the route (e.g. 'admin')
 */
export const requireRole = (role) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
  }

  const userRole = req.user.app_metadata?.role;

  if (userRole !== role) {
    return next(
      new AppError(403, 'FORBIDDEN', `Forbidden: requires ${role} role`)
    );
  }

  next();
};
