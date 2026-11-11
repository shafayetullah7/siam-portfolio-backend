import { z } from 'zod';

const SERVICE_TYPES = [
  'reviewing',
  'committee',
  'mentoring',
  'outreach',
  'editorial',
  'other',
] as const;

const optionalText = z.string().max(10_000).optional().nullable();

export const createAcademicServiceBodySchema = z.object({
  organization: z.string().min(1).max(500),
  roleTitle: z.string().min(1).max(500),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  startYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  endYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  proofUrl: z
    .string()
    .max(2000)
    .regex(/^https:\/\/.+/i)
    .optional()
    .nullable(),
  summary: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(10_000).optional(),
});

export type CreateAcademicServiceBody = z.infer<
  typeof createAcademicServiceBodySchema
>;
