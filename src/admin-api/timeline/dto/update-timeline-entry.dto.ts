import { z } from 'zod';
import { createTimelineEntryBodySchema } from './create-timeline-entry.dto';

export const updateTimelineEntryBodySchema =
  createTimelineEntryBodySchema.partial();

export type UpdateTimelineEntryBody = z.infer<
  typeof updateTimelineEntryBodySchema
>;
