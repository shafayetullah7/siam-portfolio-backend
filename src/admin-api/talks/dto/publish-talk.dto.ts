import { z } from 'zod';

export const publishTalkBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishTalkBody = z.infer<typeof publishTalkBodySchema>;
