import { z } from 'zod';
import { evaluationMaturitySchema } from './evaluation-maturity.schema';
import { projectMetricsBodySchema } from './project-metric.dto';
import { projectResourcesBodySchema } from './project-resource.dto';
import { projectSectionsBodySchema } from './project-section.dto';
import { projectStatusSchema } from './project-status.schema';
import { projectTypeSchema } from './project-type.schema';

const longText = z.string().max(100_000).optional().nullable();

export const createProjectBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(500),
  summary: z.string().min(1).max(100_000),
  tags: z.array(z.string().max(100)).max(30).optional().nullable(),
  projectType: projectTypeSchema.optional(),
  projectStatus: projectStatusSchema.optional(),
  evaluationMaturity: evaluationMaturitySchema.optional(),
  ownerRole: longText,
  ownerContribution: longText,
  resultTeaser: longText,
  periodStart: z.string().max(20).optional().nullable(),
  periodEnd: z.string().max(20).optional().nullable(),
  coverMediaId: z.string().uuid().nullable().optional(),
  featured: z.boolean().optional(),
  featuredOnHome: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: longText,
  hideFromSearch: z.boolean().optional(),
  sections: projectSectionsBodySchema,
  resources: projectResourcesBodySchema,
  metrics: projectMetricsBodySchema,
});

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
