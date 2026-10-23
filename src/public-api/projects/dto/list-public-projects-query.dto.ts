import { z } from 'zod';
import { projectStatusSchema } from '../../../admin-api/projects/dto/project-status.schema';
import { projectTypeSchema } from '../../../admin-api/projects/dto/project-type.schema';

export const listPublicProjectsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).max(200).optional(),
  projectType: projectTypeSchema.optional(),
  projectStatus: projectStatusSchema.optional(),
  featured: z.coerce.boolean().optional(),
  excludeFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ListPublicProjectsQuery = z.infer<
  typeof listPublicProjectsQuerySchema
>;
