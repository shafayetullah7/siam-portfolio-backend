import { z } from 'zod';

export const projectSectionKindSchema = z.enum([
  'problem',
  'context',
  'responsibilities',
  'solution',
  'data_methods',
  'evaluation',
  'results',
  'limitations',
  'future_work',
  'custom',
]);

const sectionBody = z.string().max(100_000);

export const projectSectionInputSchema = z.object({
  kind: projectSectionKindSchema.optional(),
  title: z.string().max(300).optional().nullable(),
  body: sectionBody,
  mediaIds: z.array(z.string().uuid()).max(5).optional(),
});

export const projectSectionsBodySchema = z
  .array(projectSectionInputSchema)
  .max(40)
  .optional();

export const projectSectionAdminSchema = z.object({
  sortOrder: z.number().int().min(0),
  kind: projectSectionKindSchema,
  title: z.string().max(300).nullable(),
  body: sectionBody,
  mediaIds: z.array(z.string().uuid()).optional(),
});
