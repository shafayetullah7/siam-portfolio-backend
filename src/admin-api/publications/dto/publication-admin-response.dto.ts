import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { publicationAuthorAdminSchema } from './publication-author.dto';
import {
  publicationPdfMediaSummarySchema,
  publicationSupplementAdminSchema,
} from './publication-supplement.dto';
import { publicationTypeSchema } from './publication-type.schema';

export const publicationAdminResponseSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    authorsShort: z.string(),
    authors: z.array(publicationAuthorAdminSchema),
    year: z.number().int(),
    venue: z.string(),
    significance: z.string().nullable(),
    abstract: z.string().nullable(),
    publicationType: publicationTypeSchema,
    peerReviewed: z.boolean(),
    doi: z.string().nullable(),
    publisherUrl: z.string().nullable(),
    featured: z.boolean(),
    featuredOnHome: z.boolean(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    ownerContribution: z.string().nullable(),
    correctionNotice: z.string().nullable(),
    hideFromSearch: z.boolean(),
    supplements: z.array(publicationSupplementAdminSchema),
    pdfMediaId: z.string().uuid().nullable(),
    openAccess: z.boolean(),
    pdfRightsGranted: z.boolean(),
    pdfMedia: publicationPdfMediaSummarySchema.nullable().optional(),
    publishStatus: z.enum(PUBLISH_STATUSES),
    publishedAt: z.string().nullable(),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    duplicateHint: z.boolean().optional(),
  })
  .meta({ title: 'PublicationAdmin' });

export type PublicationAdminResponse = z.infer<
  typeof publicationAdminResponseSchema
>;
