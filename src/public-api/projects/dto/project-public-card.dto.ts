import { z } from 'zod';
import { projectResourceTypeSchema } from '../../../admin-api/projects/dto/project-resource.dto';
import { projectStatusSchema } from '../../../admin-api/projects/dto/project-status.schema';
import { projectTypeSchema } from '../../../admin-api/projects/dto/project-type.schema';

const projectPrimaryResourceSchema = z.object({
  label: z.string(),
  url: z.string(),
  resourceType: projectResourceTypeSchema,
});

export const projectPublicCardSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    href: z.string(),
    projectType: projectTypeSchema,
    projectStatus: projectStatusSchema,
    ownerContribution: z.string().optional(),
    resultTeaser: z.string().optional(),
    featured: z.boolean().optional(),
    primaryResource: projectPrimaryResourceSchema.optional(),
    coverUrl: z.string().nullable().optional(),
    coverAlt: z.string().nullable().optional(),
  })
  .meta({ title: 'ProjectPublicCard' });

export type ProjectPublicCardDto = z.infer<typeof projectPublicCardSchema>;
