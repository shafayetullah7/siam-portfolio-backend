import { z } from 'zod';
import { publicationAuthorsBodySchema } from './publication-author.dto';
import { publicationSupplementsBodySchema } from './publication-supplement.dto';
import { publicationTypeSchema } from './publication-type.schema';

const longText = z.string().max(100_000).optional().nullable();

export const createPublicationBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(500),
  authors: publicationAuthorsBodySchema,
  year: z.coerce.number().int().min(1900).max(2100),
  venue: z.string().min(1).max(300),
  significance: longText,
  abstract: longText,
  publicationType: publicationTypeSchema.optional(),
  peerReviewed: z.boolean().optional(),
  doi: z.string().max(200).optional().nullable(),
  publisherUrl: z.string().max(2000).optional().nullable(),
  featured: z.boolean().optional(),
  featuredOnHome: z.boolean().optional(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: longText,
  ownerContribution: longText,
  correctionNotice: longText,
  hideFromSearch: z.boolean().optional(),
  supplements: publicationSupplementsBodySchema,
  pdfMediaId: z.string().uuid().nullable().optional(),
  openAccess: z.boolean().optional(),
  pdfRightsGranted: z.boolean().optional(),
});

export type CreatePublicationBody = z.infer<typeof createPublicationBodySchema>;
