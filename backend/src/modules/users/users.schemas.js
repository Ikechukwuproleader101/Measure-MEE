import { z } from 'zod';

/**
 * Zod schema for updating user profile.
 * Strictly forbids unknown fields and sensitive fields (email, id, deleted_at, roles).
 */
export const updateProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(100).optional(),
    avatar_url: z.string().url().max(500).optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    onboarding_completed: z.boolean().optional(),
  })
  .strict({
    message: 'Unknown fields are not allowed on profile update',
  });

/**
 * Zod schema for updating user settings.
 */
export const updateSettingsSchema = z
  .object({
    locale: z.string().trim().min(2).max(10).optional(),
    timezone: z.string().trim().min(1).max(50).optional(),
    notifications: z.record(z.any()).optional(),
  })
  .strict({
    message: 'Unknown fields are not allowed on settings update',
  });

/**
 * Zod schema for admin user pagination.
 */
export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
