import { z } from 'zod';

export const publicationSlugParamSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type PublicationSlugParam = z.infer<typeof publicationSlugParamSchema>;
