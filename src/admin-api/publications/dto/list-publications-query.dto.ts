import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const listPublicationsQuerySchema = z.object({
  q: z.string().optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListPublicationsQuery = z.infer<typeof listPublicationsQuerySchema>;
