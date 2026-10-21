import { z } from 'zod';

export const publishChecklistItemSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const researchPublishChecklistResponseSchema = z
  .object({
    errors: z.array(publishChecklistItemSchema),
    warnings: z.array(publishChecklistItemSchema),
  })
  .meta({ title: 'ResearchPublishChecklist' });

export type ResearchPublishChecklistResponse = z.infer<
  typeof researchPublishChecklistResponseSchema
>;
