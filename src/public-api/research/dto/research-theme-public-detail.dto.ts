import { z } from 'zod';

const publicCollaboratorSchema = z.object({
  name: z.string(),
  role: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
});

const publicCoverSchema = z.object({
  url: z.string(),
  alt: z.string().nullable(),
});

const publicSeoSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const publicResourceSchema = z.object({
  label: z.string(),
  url: z.string(),
  resourceType: z.enum(['code', 'data', 'demo', 'paper', 'other']),
});

const publicationCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  authorsShort: z.string(),
  year: z.number().int(),
  venue: z.string(),
  significance: z.string().optional(),
  href: z.string(),
});

const projectCardSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).optional(),
  href: z.string(),
});

const publicRelatedSchema = z.object({
  publications: z.array(publicationCardSchema),
  projects: z.array(projectCardSchema),
  talks: z.array(z.object({ slug: z.string() })),
});

export const researchThemePublicDetailSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    themeStatus: z.enum(['ongoing', 'completed']),
    tags: z.array(z.string()).nullable(),
    linkLabel: z.string().nullable().optional(),
    problem: z.string(),
    significance: z.string().nullable().optional(),
    objectives: z.string().nullable().optional(),
    approach: z.string().nullable().optional(),
    findings: z.string().nullable().optional(),
    limitations: z.string().nullable().optional(),
    futureWork: z.string().nullable().optional(),
    collaborators: z.array(publicCollaboratorSchema).nullable().optional(),
    acknowledgments: z.string().nullable().optional(),
    funding: z.string().nullable().optional(),
    resources: z.array(publicResourceSchema).optional(),
    related: publicRelatedSchema.optional(),
    cover: publicCoverSchema.optional(),
    seo: publicSeoSchema,
    updatedAt: z.string().optional(),
    prevSlug: z.string().optional(),
    nextSlug: z.string().optional(),
  })
  .meta({ title: 'ResearchThemeDetailPublic' });

export type ResearchThemePublicDetail = z.infer<
  typeof researchThemePublicDetailSchema
>;
