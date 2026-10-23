import { z } from 'zod';

const longText = z.string().max(100_000).optional().nullable();

export const createArticleBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(100_000),
  subtitle: longText,
  body: z.string().max(500_000).optional(),
  tags: z.array(z.string().max(100)).max(30).optional().nullable(),
  seriesId: z.string().uuid().nullable().optional(),
  seriesSortOrder: z.coerce.number().int().min(0).max(10_000).optional().nullable(),
  coverMediaId: z.string().uuid().nullable().optional(),
  byline: longText,
  featuredOnHub: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: longText,
  hideFromSearch: z.boolean().optional(),
});

export type CreateArticleBody = z.infer<typeof createArticleBodySchema>;
