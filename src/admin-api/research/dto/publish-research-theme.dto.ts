import { z } from 'zod';

export const publishResearchThemeBodySchema = z
  .object({
    confirmWarnings: z.boolean().optional(),
  })
  .default({});

export type PublishResearchThemeBody = z.infer<
  typeof publishResearchThemeBodySchema
>;
