import { z } from 'zod';

const homeResearchFocusItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  href: z.string(),
  tags: z.array(z.string()).optional(),
  coverUrl: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
});

const homePublicationHighlightSchema = z.object({
  title: z.string(),
  authorsShort: z.string(),
  year: z.number(),
  venue: z.string(),
  significance: z.string(),
  href: z.string(),
  featured: z.boolean().optional(),
});

const homeProjectHighlightSchema = z.object({
  title: z.string(),
  summary: z.string(),
  href: z.string(),
  tags: z.array(z.string()).optional(),
  coverUrl: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
});

export const publicHomeResponseSchema = z.object({
  heroTitle: z.string().nullable(),
  heroSubtitle: z.string().nullable(),
  researchFocus: z.array(homeResearchFocusItemSchema),
  selectedPublications: z.array(homePublicationHighlightSchema).optional(),
  selectedProjects: z.array(homeProjectHighlightSchema).optional(),
});

export type PublicHomeResponse = z.infer<typeof publicHomeResponseSchema>;
export type HomeResearchFocusPublic = z.infer<
  typeof homeResearchFocusItemSchema
>;
export type HomePublicationHighlightPublic = z.infer<
  typeof homePublicationHighlightSchema
>;
export type HomeProjectHighlightPublic = z.infer<
  typeof homeProjectHighlightSchema
>;
