import { z } from 'zod';
import { publicationAuthorInputSchema } from './publication-author.dto';
import { publicationTypeSchema } from './publication-type.schema';

const importProposedSchema = z.object({
  slug: z.string(),
  title: z.string(),
  authors: z.array(publicationAuthorInputSchema),
  year: z.number().int(),
  venue: z.string(),
  significance: z.string().nullable().optional(),
  abstract: z.string().nullable().optional(),
  publicationType: publicationTypeSchema,
  peerReviewed: z.boolean().optional(),
  doi: z.string().nullable().optional(),
  publisherUrl: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
});

const importDuplicateSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  year: z.number().int(),
  doi: z.string().nullable(),
  matchReason: z.enum(['doi', 'title_year']),
});

export const importPreviewResponseSchema = z
  .object({
    source: z.enum(['bibtex', 'doi']),
    proposed: importProposedSchema,
    duplicates: z.array(importDuplicateSchema),
    parseWarnings: z.array(z.string()),
    lowConfidenceFields: z.array(z.string()),
  })
  .meta({ title: 'PublicationImportPreview' });

export type ImportPreviewResponse = z.infer<typeof importPreviewResponseSchema>;
