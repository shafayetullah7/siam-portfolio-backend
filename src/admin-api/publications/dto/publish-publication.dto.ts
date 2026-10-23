import { z } from 'zod';

export const publishPublicationBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishPublicationBody = z.infer<typeof publishPublicationBodySchema>;
