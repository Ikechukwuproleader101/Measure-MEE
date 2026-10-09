import { createUserClient, supabaseAdmin } from '../../config/supabase.js';
import * as userRepository from './users.repository.js';

/**
 * User Service
 * Holds all business logic and delegates persistence strictly to users.repository.js.
 * Completely decoupled from HTTP (no req/res references).
 */

/**
 * Retrieve current user's profile, settings, and assigned roles.
 */
export const getCurrentUser = async (accessToken, user) => {
  const client = createUserClient(accessToken);

  const [profile, settings, roles] = await Promise.all([
    userRepository.getProfileById(client, user.id),
    userRepository.getSettingsByUserId(client, user.id),
    userRepository.getRolesByUserId(client, user.id),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.app_metadata?.role || 'user',
    },
    profile,
    settings: settings || {
      locale: 'en',
      timezone: 'UTC',
      notifications: {},
    },
    roles,
  };
};

/**
 * Update current user's profile information.
 */
export const updateCurrentUserProfile = async (accessToken, userId, updates) => {
  const client = createUserClient(accessToken);
  return await userRepository.updateProfile(client, userId, updates);
};

/**
 * Update current user's settings.
 */
export const updateCurrentUserSettings = async (accessToken, userId, updates) => {
  const client = createUserClient(accessToken);
  return await userRepository.updateSettings(client, userId, updates);
};

/**
 * Soft delete user account and record audit trail.
 */
export const softDeleteCurrentUser = async (userId, ipAddress) => {
  const deleted = await userRepository.softDeleteProfile(supabaseAdmin, userId);

  await userRepository.createAuditLog(supabaseAdmin, {
    userId,
    action: 'profile.deleted',
    metadata: { soft_deleted: true },
    ipAddress,
  });

  return deleted;
};

/**
 * List paginated users for admin dashboard.
 */
export const getAdminUsersList = async ({ page, limit }) => {
  return await userRepository.listUsersAdmin(supabaseAdmin, { page, limit });
};
