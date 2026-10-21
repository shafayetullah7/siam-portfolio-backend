import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const researchThemeProjectLinkSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  sortOrder: z.number().int(),
});

export type ResearchThemeProjectLink = z.infer<
  typeof researchThemeProjectLinkSchema
>;

export const putResearchThemeProjectsBodySchema = z.object({
  projectIds: z.array(z.string().uuid()).max(20),
});

export type PutResearchThemeProjectsBody = z.infer<
  typeof putResearchThemeProjectsBodySchema
>;
