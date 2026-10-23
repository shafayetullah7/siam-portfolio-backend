import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { publicationTypeSchema } from './publication-type.schema';

export const listPublicationsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  publicationType: publicationTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type ListPublicationsQuery = z.infer<typeof listPublicationsQuerySchema>;
