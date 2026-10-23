import { z } from 'zod';

export const publishChecklistItemSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const timelinePublishChecklistSchema = z.object({
  errors: z.array(publishChecklistItemSchema),
  warnings: z.array(publishChecklistItemSchema),
});

export type TimelinePublishChecklistDto = z.infer<
  typeof timelinePublishChecklistSchema
>;
