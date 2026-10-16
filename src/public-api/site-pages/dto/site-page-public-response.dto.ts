import { z } from 'zod';

export const sitePagePublicResponseSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    body: z.string(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    publishedAt: z.string().nullable(),
  })
  .meta({ title: 'SitePagePublic' });

export type SitePagePublicResponse = z.infer<typeof sitePagePublicResponseSchema>;
