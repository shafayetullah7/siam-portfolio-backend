import { z } from 'zod';

export const publishChecklistItemSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const publicationPublishChecklistResponseSchema = z
  .object({
    errors: z.array(publishChecklistItemSchema),
    warnings: z.array(publishChecklistItemSchema),
  })
  .meta({ title: 'PublicationPublishChecklist' });

export type PublicationPublishChecklistResponse = z.infer<
  typeof publicationPublishChecklistResponseSchema
>;
