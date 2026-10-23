import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { projectTypeSchema } from './project-type.schema';

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  projectType: projectTypeSchema.optional(),
  featured: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
