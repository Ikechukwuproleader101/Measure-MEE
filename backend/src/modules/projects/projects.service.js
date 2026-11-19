import { createUserClient } from '../../config/supabase.js';
import * as projectsRepository from './projects.repository.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Projects Service
 * Decoupled from HTTP; uses createUserClient to ensure Postgres RLS is enforced.
 */

export const getProjectsList = async (accessToken, user, { isArchived = false }) => {
  const client = createUserClient(accessToken);
  return projectsRepository.listProjects(client, user.id, isArchived);
};

export const createProject = async (accessToken, user, { name }) => {
  const client = createUserClient(accessToken);
  return projectsRepository.createProject(client, user.id, name);
};

export const updateProject = async (accessToken, user, projectId, updates) => {
  const client = createUserClient(accessToken);
  const updated = await projectsRepository.updateProject(client, user.id, projectId, updates);

  if (!updated) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  return updated;
};

export const getProject = async (accessToken, user, projectId) => {
  const client = createUserClient(accessToken);
  const project = await projectsRepository.getProjectById(client, user.id, projectId);

  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  return project;
};

export const getCurrentProject = async (accessToken, user) => {
  const client = createUserClient(accessToken);
  const project = await projectsRepository.getCurrentProject(client, user.id);
  return project || null;
};

export const addMeasurement = async (accessToken, user, projectId, { description }) => {
  const client = createUserClient(accessToken);

  // 1. Verify project exists and belongs to user
  const project = await projectsRepository.getProjectById(client, user.id, projectId);
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'Project not found');
  }

  // 2. Insert measurement
  const measurement = await projectsRepository.createMeasurement(client, projectId, description);

  // 3. Touch parent project's updated_at timestamp
  await projectsRepository.touchProjectUpdatedAt(client, user.id, projectId);

  return measurement;
};

