import { z } from 'zod';

export const publishChecklistItemSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const projectPublishChecklistResponseSchema = z
  .object({
    errors: z.array(publishChecklistItemSchema),
    warnings: z.array(publishChecklistItemSchema),
  })
  .meta({ title: 'ProjectPublishChecklist' });

export type ProjectPublishChecklistResponse = z.infer<
  typeof projectPublishChecklistResponseSchema
>;
