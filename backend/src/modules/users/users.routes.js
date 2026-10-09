import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import * as usersController from './users.controller.js';
import {
  updateProfileSchema,
  updateSettingsSchema,
  adminUsersQuerySchema,
} from './users.schemas.js';

const router = Router();

// Current authenticated user endpoints
router.get('/me', requireAuth, usersController.getMe);

router.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  usersController.updateMe
);

router.patch(
  '/me/settings',
  requireAuth,
  validate({ body: updateSettingsSchema }),
  usersController.updateSettings
);

router.delete('/me', requireAuth, usersController.deleteMe);

// Admin-only endpoints
router.get(
  '/admin/users',
  requireAuth,
  requireRole('admin'),
  validate({ query: adminUsersQuerySchema }),
  usersController.getAdminUsers
);

export const usersRoutes = router;
