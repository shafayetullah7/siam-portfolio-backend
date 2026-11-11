import { z } from 'zod';

export const publishSingletonBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishSingletonBody = z.infer<typeof publishSingletonBodySchema>;
