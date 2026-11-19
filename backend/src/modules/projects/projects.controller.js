import * as projectsService from './projects.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Projects Controller
 * Handles HTTP requests, delegates to projects.service.js, and formats JSON responses.
 */

export const listProjects = asyncHandler(async (req, res) => {
  const isArchived = req.query.archived ?? false;
  const projects = await projectsService.getProjectsList(req.accessToken, req.user, {
    isArchived,
  });
  res.status(200).json(projects);
});

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectsService.createProject(req.accessToken, req.user, {
    name: req.body.name,
  });
  res.status(201).json(project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectsService.updateProject(
    req.accessToken,
    req.user,
    req.params.id,
    req.body
  );
  res.status(200).json(project);
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectsService.getProject(
    req.accessToken,
    req.user,
    req.params.id
  );
  res.status(200).json(project);
});

export const getCurrentProject = asyncHandler(async (req, res) => {
  const project = await projectsService.getCurrentProject(
    req.accessToken,
    req.user
  );
  res.status(200).json(project);
});

export const createMeasurement = asyncHandler(async (req, res) => {
  const measurement = await projectsService.addMeasurement(
    req.accessToken,
    req.user,
    req.params.id,
    req.body
  );
  res.status(201).json(measurement);
});

