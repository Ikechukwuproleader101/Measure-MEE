import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import * as projectsController from './projects.controller.js';
import {
  listProjectsQuerySchema,
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
} from './projects.schemas.js';

const router = Router();

// All project endpoints require valid Supabase authentication
router.use(requireAuth);

router.get(
  '/',
  validate({ query: listProjectsQuerySchema }),
  projectsController.listProjects
);

router.post(
  '/',
  validate({ body: createProjectSchema }),
  projectsController.createProject
);

router.get(
  '/current',
  projectsController.getCurrentProject
);

router.get(
  '/:id',
  validate({ params: projectParamsSchema }),
  projectsController.getProject
);

router.patch(
  '/:id',
  validate({ params: projectParamsSchema, body: updateProjectSchema }),
  projectsController.updateProject
);

export const projectsRoutes = router;

