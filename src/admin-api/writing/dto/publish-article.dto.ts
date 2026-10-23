import { z } from 'zod';

export const publishArticleBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishArticleBody = z.infer<typeof publishArticleBodySchema>;
