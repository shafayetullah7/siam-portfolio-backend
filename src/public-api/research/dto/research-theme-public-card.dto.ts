import { z } from 'zod';

export const researchThemePublicCardSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    themeStatus: z.enum(['ongoing', 'completed']),
    tags: z.array(z.string()).nullable(),
    coverUrl: z.string().nullable().optional(),
    coverAlt: z.string().nullable().optional(),
    href: z.string(),
    relatedCounts: z
      .object({
        publications: z.number(),
        projects: z.number(),
      })
      .optional(),
  })
  .meta({ title: 'ResearchThemePublicCard' });

export type ResearchThemePublicCard = z.infer<
  typeof researchThemePublicCardSchema
>;
