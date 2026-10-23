import { z } from 'zod';
import { publicationTypeSchema } from '../../../admin-api/publications/dto/publication-type.schema';

export const listPublicPublicationsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  type: publicationTypeSchema.optional(),
  theme: z.string().trim().min(1).max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ListPublicPublicationsQuery = z.infer<
  typeof listPublicPublicationsQuerySchema
>;
