import { z } from 'zod';

const shortText = z.string().max(300).optional().nullable();
const longText = z.string().max(10_000).optional().nullable();

export const projectMetricInputSchema = z.object({
  name: z.string().min(1).max(300),
  value: z.string().min(1).max(200),
  unit: z.string().max(100).optional().nullable(),
  baseline: z.string().max(200).optional().nullable(),
  notes: longText,
  caption: longText,
});

export const projectMetricsBodySchema = z
  .array(projectMetricInputSchema)
  .max(30)
  .optional();

export const projectMetricAdminSchema = z.object({
  sortOrder: z.number().int().min(0),
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable(),
  baseline: z.string().nullable(),
  notes: z.string().nullable(),
  caption: z.string().nullable(),
});
