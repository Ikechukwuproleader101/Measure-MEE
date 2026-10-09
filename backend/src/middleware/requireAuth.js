import { supabaseAdmin } from '../config/supabase.js';
import { AppError } from '../utils/AppError.js';

/**
 * Authentication middleware that verifies the Supabase Bearer JWT token.
 * Validates the token against Supabase Auth (without manually decoding JWTs),
 * verifies the user exists and is not soft-deleted, and attaches req.user and req.accessToken.
 */
export const requireAuth = async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header')
    );
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    return next(
      new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header')
    );
  }

  try {
    // Verify token directly with Supabase Auth
    const { data: { user } = {}, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
    }

    // Check if account has been soft-deleted
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('deleted_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!profileError && profile?.deleted_at) {
      return next(
        new AppError(403, 'ACCOUNT_DELETED', 'This account has been deleted')
      );
    }

    // Attach verified user and token
    req.user = user;
    req.accessToken = token;

    next();
  } catch (err) {
    next(err);
  }
};
