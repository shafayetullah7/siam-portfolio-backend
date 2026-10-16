import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const sitePageAdminResponseSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    title: z.string(),
    body: z.string(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    publishedAt: z.string().nullable(),
    publishStatus: z.enum(PUBLISH_STATUSES),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'SitePageAdmin' });

export type SitePageAdminResponse = z.infer<typeof sitePageAdminResponseSchema>;
