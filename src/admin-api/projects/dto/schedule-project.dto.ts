import { z } from 'zod';

export const scheduleProjectBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type ScheduleProjectBody = z.infer<typeof scheduleProjectBodySchema>;
