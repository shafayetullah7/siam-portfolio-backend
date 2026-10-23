import { z } from 'zod';

export const schedulePublicationBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type SchedulePublicationBody = z.infer<
  typeof schedulePublicationBodySchema
>;
