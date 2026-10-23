import { z } from 'zod';
import { evaluationMaturitySchema } from '../../../admin-api/projects/dto/evaluation-maturity.schema';
import { projectResourceTypeSchema } from '../../../admin-api/projects/dto/project-resource.dto';
import { projectSectionKindSchema } from '../../../admin-api/projects/dto/project-section.dto';
import { projectStatusSchema } from '../../../admin-api/projects/dto/project-status.schema';
import { projectTypeSchema } from '../../../admin-api/projects/dto/project-type.schema';

const projectPublicSectionFigureSchema = z.object({
  url: z.string(),
  alt: z.string().nullable(),
  caption: z.string().nullable().optional(),
});

const projectPublicSectionSchema = z.object({
  kind: projectSectionKindSchema,
  title: z.string().optional(),
  body: z.string(),
  sortOrder: z.number().int(),
  figures: z.array(projectPublicSectionFigureSchema).optional(),
});

const publicationRelatedCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  authorsShort: z.string(),
  year: z.number().int(),
  venue: z.string(),
  publicationType: z.enum([
    'journal',
    'conference',
    'preprint',
    'workshop',
    'thesis',
    'other',
  ]),
  significance: z.string().optional(),
  doi: z.string().optional(),
  href: z.string(),
});

const themeRelatedCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  href: z.string(),
});

const projectPublicRelatedSchema = z.object({
  publications: z.array(publicationRelatedCardSchema),
  themes: z.array(themeRelatedCardSchema),
});

const projectPublicResourceSchema = z.object({
  resourceType: projectResourceTypeSchema,
  label: z.string(),
  url: z.string(),
  sortOrder: z.number().int(),
});

const projectPublicMetricSchema = z.object({
  name: z.string(),
  value: z.string(),
  unit: z.string().optional(),
  baseline: z.string().optional(),
  notes: z.string().optional(),
  caption: z.string().optional(),
  sortOrder: z.number().int(),
});

const projectPublicCoverSchema = z.object({
  url: z.string(),
  alt: z.string().nullable(),
});

export const projectPublicDetailSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    href: z.string(),
    tags: z.array(z.string()).optional(),
    projectType: projectTypeSchema,
    projectStatus: projectStatusSchema,
    evaluationMaturity: evaluationMaturitySchema,
    ownerRole: z.string().optional(),
    ownerContribution: z.string().optional(),
    resultTeaser: z.string().optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    featured: z.boolean(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    cover: projectPublicCoverSchema.optional(),
    prevSlug: z.string().optional(),
    nextSlug: z.string().optional(),
    sections: z.array(projectPublicSectionSchema),
    resources: z.array(projectPublicResourceSchema),
    metrics: z.array(projectPublicMetricSchema),
    related: projectPublicRelatedSchema.optional(),
  })
  .meta({ title: 'ProjectPublicDetail' });

export type ProjectPublicDetailDto = z.infer<typeof projectPublicDetailSchema>;
