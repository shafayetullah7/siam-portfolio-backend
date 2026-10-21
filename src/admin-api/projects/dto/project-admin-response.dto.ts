import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const projectAdminResponseSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).nullable(),
    publishStatus: z.enum(PUBLISH_STATUSES),
    publishedAt: z.string().nullable(),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'ProjectAdmin' });

export type ProjectAdminResponse = z.infer<typeof projectAdminResponseSchema>;
