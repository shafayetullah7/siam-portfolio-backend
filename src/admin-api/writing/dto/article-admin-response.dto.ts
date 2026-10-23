import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const articleAdminResponseSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  summary: z.string(),
  body: z.string(),
  tags: z.array(z.string()).nullable(),
  seriesId: z.string().uuid().nullable(),
  seriesSortOrder: z.number().int().nullable(),
  coverMediaId: z.string().uuid().nullable(),
  byline: z.string().nullable(),
  readingTimeMinutes: z.number().int().nullable(),
  wordCount: z.number().int().nullable(),
  featuredOnHub: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  materiallyUpdatedAt: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  hideFromSearch: z.boolean(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  publishedAt: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ArticleAdminResponse = z.infer<typeof articleAdminResponseSchema>;
