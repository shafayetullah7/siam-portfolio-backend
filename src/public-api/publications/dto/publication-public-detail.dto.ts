import { z } from 'zod';
import { publicationAuthorPublicSchema } from '../../../admin-api/publications/dto/publication-author.dto';
import { publicationSupplementPublicSchema } from '../../../admin-api/publications/dto/publication-supplement.dto';
import { publicationPublicCardSchema } from './publication-public-card.dto';

export const publicationPublicDetailSchema = publicationPublicCardSchema
  .extend({
    abstract: z.string().optional(),
    peerReviewed: z.boolean(),
    publisherUrl: z.string().optional(),
    ownerContribution: z.string().optional(),
    correctionNotice: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    authors: z.array(publicationAuthorPublicSchema).optional(),
    supplements: z.array(publicationSupplementPublicSchema).optional(),
    pdfHref: z.string().optional(),
  })
  .meta({ title: 'PublicationPublicDetail' });

export type PublicationPublicDetailDto = z.infer<
  typeof publicationPublicDetailSchema
>;
