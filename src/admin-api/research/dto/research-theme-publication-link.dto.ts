import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const researchThemePublicationLinkSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  authorsShort: z.string(),
  year: z.number().int(),
  venue: z.string(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  sortOrder: z.number().int(),
});

export type ResearchThemePublicationLink = z.infer<
  typeof researchThemePublicationLinkSchema
>;

export const putResearchThemePublicationsBodySchema = z.object({
  publicationIds: z.array(z.string().uuid()).max(20),
});

export type PutResearchThemePublicationsBody = z.infer<
  typeof putResearchThemePublicationsBodySchema
>;
