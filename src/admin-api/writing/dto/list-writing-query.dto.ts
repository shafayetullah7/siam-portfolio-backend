import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const LIST_WRITING_SORTS = [
  'updatedAtDesc',
  'titleAsc',
  'publishedAtDesc',
] as const;

export const listWritingQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  tag: z.string().trim().min(1).max(100).optional(),
  seriesId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_WRITING_SORTS).optional(),
});

export type ListWritingQuery = z.infer<typeof listWritingQuerySchema>;
