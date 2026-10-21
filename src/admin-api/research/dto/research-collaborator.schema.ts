import { z } from 'zod';

const optionalUrl = z
  .union([z.string().url().max(500), z.literal('')])
  .optional()
  .nullable()
  .transform((v) => (v === '' || v === undefined ? null : v));

export const researchCollaboratorSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional().nullable(),
  url: optionalUrl,
});

export const researchCollaboratorsSchema = z
  .array(researchCollaboratorSchema)
  .max(50)
  .optional()
  .nullable();
