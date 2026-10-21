import { z } from 'zod';

export const mediaListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  mime: z.string().trim().min(1).max(100).optional(),
  imagesOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
