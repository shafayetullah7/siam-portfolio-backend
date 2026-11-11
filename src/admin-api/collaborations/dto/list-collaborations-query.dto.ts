import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const LIST_COLLABORATIONS_SORTS = [
  'updatedAtDesc',
  'sortOrderAsc',
  'partnerNameAsc',
] as const;

export const listCollaborationsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_COLLABORATIONS_SORTS).optional(),
});

export type ListCollaborationsQuery = z.infer<typeof listCollaborationsQuerySchema>;
