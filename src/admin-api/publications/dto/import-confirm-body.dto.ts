import { z } from 'zod';
import { publicationAuthorsBodySchema } from './publication-author.dto';
import { publicationTypeSchema } from './publication-type.schema';
import { PUBLICATION_IMPORT_MERGE_FIELDS } from '../../../domain/publications/publication-import.types';

const longText = z.string().max(100_000).optional().nullable();

const importProposedOverridesSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    title: z.string().min(1).max(500).optional(),
    authors: publicationAuthorsBodySchema.optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional(),
    venue: z.string().min(1).max(300).optional(),
    significance: longText,
    abstract: longText,
    publicationType: publicationTypeSchema.optional(),
    peerReviewed: z.boolean().optional(),
    doi: z.string().max(200).optional().nullable(),
    publisherUrl: z.string().max(2000).optional().nullable(),
    seoTitle: z.string().max(500).optional().nullable(),
    seoDescription: longText,
  })
  .partial();

export const importConfirmBodySchema = z
  .object({
    source: z.enum(['bibtex', 'doi']),
    bibtex: z.string().max(500_000).optional(),
    doi: z.string().max(200).optional(),
    action: z.enum(['create', 'merge']),
    mergePublicationId: z.string().uuid().optional(),
    mergeFields: z
      .array(z.enum(PUBLICATION_IMPORT_MERGE_FIELDS))
      .optional(),
    overrides: importProposedOverridesSchema.optional(),
  })
  .superRefine((body, ctx) => {
    if (body.source === 'bibtex' && !body.bibtex?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'bibtex is required when source is bibtex',
        path: ['bibtex'],
      });
    }
    if (body.source === 'doi' && !body.doi?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'doi is required when source is doi',
        path: ['doi'],
      });
    }
    if (body.action === 'merge' && !body.mergePublicationId) {
      ctx.addIssue({
        code: 'custom',
        message: 'mergePublicationId is required when action is merge',
        path: ['mergePublicationId'],
      });
    }
  });

export type ImportConfirmBody = z.infer<typeof importConfirmBodySchema>;
