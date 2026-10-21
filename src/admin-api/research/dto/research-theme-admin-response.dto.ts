import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { researchCollaboratorSchema } from './research-collaborator.schema';
import { researchThemeResourceAdminSchema } from './research-theme-resource.schema';

export const researchThemeAdminResponseSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    themeStatus: z.enum(['ongoing', 'completed']),
    problem: z.string(),
    significance: z.string().nullable(),
    objectives: z.string().nullable(),
    approach: z.string().nullable(),
    findings: z.string().nullable(),
    limitations: z.string().nullable(),
    futureWork: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    linkLabel: z.string().nullable(),
    coverMediaId: z.uuid().nullable(),
    sortOrder: z.number().int(),
    featuredOnHome: z.boolean(),
    publishStatus: z.enum(PUBLISH_STATUSES),
    publishedAt: z.string().nullable(),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    collaborators: z.array(researchCollaboratorSchema).nullable(),
    acknowledgments: z.string().nullable(),
    funding: z.string().nullable(),
    resources: z.array(researchThemeResourceAdminSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'ResearchThemeAdmin' });

export type ResearchThemeAdminResponse = z.infer<
  typeof researchThemeAdminResponseSchema
>;
