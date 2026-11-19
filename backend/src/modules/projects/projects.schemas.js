import { z } from 'zod';

/**
 * Zod schema for query params when listing projects.
 * Converts string 'true' / 'false' to boolean, defaulting to false.
 */
export const listProjectsQuerySchema = z.object({
  archived: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return false;
    }, z.boolean())
    .default(false),
});

/**
 * Zod schema for creating a project.
 * Only 'name' is accepted; client_id, status, progress, tailor_id are strictly forbidden.
 */
export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, { message: 'Project name must be between 1 and 80 characters' })
      .max(80, { message: 'Project name must be between 1 and 80 characters' }),
  })
  .strict({
    message: 'Only name is permitted when creating a project',
  });

/**
 * Zod schema for updating a project.
 * Only 'name' and/or 'is_archived' may be supplied.
 */
export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { message: 'Project name must be between 1 and 80 characters' })
      .max(80, { message: 'Project name must be between 1 and 80 characters' })
      .optional(),
    is_archived: z.boolean().optional(),
  })
  .strict({
    message: 'Only name and is_archived can be updated',
  })
  .refine(
    (data) => data.name !== undefined || data.is_archived !== undefined,
    {
      message: 'At least one field (name or is_archived) must be provided',
    }
  );

/**
 * Zod schema for project route parameters.
 */
export const projectParamsSchema = z.object({
  id: z.string().uuid({ message: 'Invalid project ID format' }),
});

/**
 * Zod schema for adding a measurement to a project.
 * Validates description: trimmed, required, 1 to 80 characters.
 */
export const createMeasurementSchema = z
  .object({
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(1, { message: 'Description must be between 1 and 80 characters' })
      .max(80, { message: 'Description must be between 1 and 80 characters' }),
  })
  .strict({
    message: 'Only description is permitted when adding a measurement',
  });

