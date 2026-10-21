import { z } from 'zod';
import { researchCollaboratorsSchema } from './research-collaborator.schema';
import { researchThemeResourcesSchema } from './research-theme-resource.schema';

const longText = z.string().max(100_000).optional().nullable();
const optionalLongText = z.string().max(100_000).optional();

export const createResearchThemeBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(300),
  summary: z.string().min(1).max(10_000),
  themeStatus: z.enum(['ongoing', 'completed']).optional(),
  problem: optionalLongText,
  significance: longText,
  objectives: longText,
  approach: longText,
  findings: longText,
  limitations: longText,
  futureWork: longText,
  tags: z.array(z.string().min(1).max(80)).max(50).optional().nullable(),
  linkLabel: z.string().max(120).optional().nullable(),
  coverMediaId: z.uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
  featuredOnHome: z.boolean().optional(),
  seoTitle: z.string().max(120).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
  collaborators: researchCollaboratorsSchema,
  acknowledgments: longText,
  funding: longText,
  resources: researchThemeResourcesSchema,
});

export type CreateResearchThemeBody = z.infer<
  typeof createResearchThemeBodySchema
>;
