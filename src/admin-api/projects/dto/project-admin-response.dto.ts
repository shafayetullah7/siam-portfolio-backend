import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { evaluationMaturitySchema } from './evaluation-maturity.schema';
import { projectMetricAdminSchema } from './project-metric.dto';
import { projectResourceAdminSchema } from './project-resource.dto';
import { projectSectionAdminSchema } from './project-section.dto';
import { projectStatusSchema } from './project-status.schema';
import { projectTypeSchema } from './project-type.schema';

export const projectAdminResponseSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).nullable(),
    projectType: projectTypeSchema,
    projectStatus: projectStatusSchema,
    evaluationMaturity: evaluationMaturitySchema,
    ownerRole: z.string().nullable(),
    ownerContribution: z.string().nullable(),
    resultTeaser: z.string().nullable(),
    periodStart: z.string().nullable(),
    periodEnd: z.string().nullable(),
    coverMediaId: z.string().uuid().nullable(),
    featured: z.boolean(),
    featuredOnHome: z.boolean(),
    sortOrder: z.number().int(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    hideFromSearch: z.boolean(),
    sections: z.array(projectSectionAdminSchema),
    resources: z.array(projectResourceAdminSchema),
    metrics: z.array(projectMetricAdminSchema),
    publishStatus: z.enum(PUBLISH_STATUSES),
    publishedAt: z.string().nullable(),
    scheduledAt: z.string().nullable(),
    archivedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ title: 'ProjectAdmin' });

export type ProjectAdminResponse = z.infer<typeof projectAdminResponseSchema>;
