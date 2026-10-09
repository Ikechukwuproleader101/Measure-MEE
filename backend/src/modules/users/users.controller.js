import * as usersService from './users.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * User Controller
 * Thin layer that extracts HTTP parameters, delegates to users.service.js, and formats the response.
 */

export const getMe = asyncHandler(async (req, res) => {
  const data = await usersService.getCurrentUser(req.accessToken, req.user);
  res.status(200).json(data);
});

export const updateMe = asyncHandler(async (req, res) => {
  const updatedProfile = await usersService.updateCurrentUserProfile(
    req.accessToken,
    req.user.id,
    req.body
  );
  res.status(200).json({ profile: updatedProfile });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const updatedSettings = await usersService.updateCurrentUserSettings(
    req.accessToken,
    req.user.id,
    req.body
  );
  res.status(200).json({ settings: updatedSettings });
});

export const deleteMe = asyncHandler(async (req, res) => {
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
  await usersService.softDeleteCurrentUser(req.user.id, ipAddress);
  res.status(200).json({ message: 'Account deleted successfully' });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await usersService.getAdminUsersList({ page, limit });
  res.status(200).json(result);
});
