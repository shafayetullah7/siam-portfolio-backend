import { z } from 'zod';

export const listPublicWritingQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  tag: z.string().trim().min(1).max(200).optional(),
  series: z.string().trim().min(1).max(200).optional(),
  sort: z.enum(['publishedAtDesc', 'titleAsc']).optional(),
  featuredOnHub: z.coerce.boolean().optional(),
  excludeFeaturedOnHub: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type ListPublicWritingQuery = z.infer<
  typeof listPublicWritingQuerySchema
>;
