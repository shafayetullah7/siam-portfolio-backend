import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const publicationAdminResponseSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    authorsShort: z.string(),
    year: z.number().int(),
    venue: z.string(),
    significance: z.string().nullable(),
    publishStatus: z.enum(PUBLISH_STATUSES),
    publishedAt: z.string().nullable(),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'PublicationAdmin' });

export type PublicationAdminResponse = z.infer<
  typeof publicationAdminResponseSchema
>;
