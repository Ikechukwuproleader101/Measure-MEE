import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/**
 * Trusted admin client created with the server-only SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS).
 *
 * USE RESTRICTIONS:
 * - Use only for trusted system actions (e.g., verifying auth tokens, admin queries, audit logs, background tasks).
 * - Never expose this client or its key to users or API responses.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Creates a scoped Supabase client for an authenticated user.
 * Created using the public SUPABASE_ANON_KEY and attaches the user's Bearer token.
 * All database operations performed with this client strictly enforce Postgres Row Level Security (RLS).
 *
 * @param {string} accessToken - Supabase Bearer JWT token from the client request
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export const createUserClient = (accessToken) => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
