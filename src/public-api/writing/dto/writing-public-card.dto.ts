import { z } from 'zod';

export const writingPublicCardSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    href: z.string(),
    tags: z.array(z.string()).optional(),
    readingTimeMinutes: z.number().int().nullable().optional(),
    publishedAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    materiallyUpdatedAt: z.string().nullable().optional(),
    featuredOnHub: z.boolean().optional(),
    coverUrl: z.string().nullable().optional(),
    coverAlt: z.string().nullable().optional(),
  })
  .meta({ title: 'WritingPublicCard' });

export type WritingPublicCardDto = z.infer<typeof writingPublicCardSchema>;
