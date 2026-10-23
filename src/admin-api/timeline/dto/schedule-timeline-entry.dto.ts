import { z } from 'zod';

export const scheduleTimelineEntryBodySchema = z.object({
  scheduledAt: z.string().min(1),
});

export type ScheduleTimelineEntryBody = z.infer<
  typeof scheduleTimelineEntryBodySchema
>;
