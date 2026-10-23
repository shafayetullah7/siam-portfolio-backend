import { z } from 'zod';

export const projectResourceTypeSchema = z.enum([
  'repo',
  'demo',
  'paper',
  'dataset',
  'model_card',
  'documentation',
  'video',
  'other',
]);

export const projectResourceInputSchema = z.object({
  resourceType: projectResourceTypeSchema.optional(),
  label: z.string().min(1).max(200),
  url: z
    .string()
    .url()
    .max(2000)
    .refine((url) => url.startsWith('https://'), {
      message: 'URL must use https://',
    }),
});

export const projectResourcesBodySchema = z
  .array(projectResourceInputSchema)
  .max(20)
  .optional();

export const projectResourceAdminSchema = z.object({
  sortOrder: z.number().int().min(0),
  resourceType: projectResourceTypeSchema,
  label: z.string(),
  url: z.string(),
});
