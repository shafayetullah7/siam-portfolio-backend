import { z } from 'zod';

export const publicationSupplementKindSchema = z.enum([
  'code',
  'data',
  'slides',
  'poster',
  'demo',
  'repository',
  'other',
]);

export const publicationSupplementInputSchema = z.object({
  label: z.string().min(1).max(200),
  url: z.string().url().max(2000).refine((url) => url.startsWith('https://'), {
    message: 'URL must use https://',
  }),
  kind: publicationSupplementKindSchema.optional(),
});

export const publicationSupplementsBodySchema = z
  .array(publicationSupplementInputSchema)
  .max(20)
  .optional();

export const publicationSupplementAdminSchema = publicationSupplementInputSchema.extend({
  sortOrder: z.number().int().min(0),
});

export const publicationSupplementPublicSchema = z.object({
  label: z.string(),
  url: z.string(),
  kind: publicationSupplementKindSchema,
});

export const publicationPdfMediaSummarySchema = z.object({
  id: z.string().uuid(),
  fileName: z.string(),
  url: z.string(),
});
