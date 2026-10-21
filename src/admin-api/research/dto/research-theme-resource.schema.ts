import { z } from 'zod';

const httpsUrl = z
  .string()
  .url()
  .max(500)
  .refine((u) => u.startsWith('https://'), 'URL must use HTTPS');

export const researchThemeResourceInputSchema = z.object({
  label: z.string().min(1).max(200),
  url: httpsUrl,
  resourceType: z.enum(['code', 'data', 'demo', 'paper', 'other']),
  sortOrder: z.number().int().optional(),
});

export const researchThemeResourcesSchema = z
  .array(researchThemeResourceInputSchema)
  .max(20)
  .optional()
  .nullable();

export const researchThemeResourceAdminSchema =
  researchThemeResourceInputSchema.extend({
    id: z.uuid(),
    sortOrder: z.number().int(),
  });
