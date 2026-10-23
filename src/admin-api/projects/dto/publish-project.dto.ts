import { z } from 'zod';

export const publishProjectBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishProjectBody = z.infer<typeof publishProjectBodySchema>;
