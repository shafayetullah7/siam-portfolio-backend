import { z } from 'zod';

export const createSitePageBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(300),
  body: z.string().max(100_000).optional().default(''),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
});

export type CreateSitePageBody = z.infer<typeof createSitePageBodySchema>;
