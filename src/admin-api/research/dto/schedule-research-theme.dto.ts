import { z } from 'zod';

export const scheduleResearchThemeBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type ScheduleResearchThemeBody = z.infer<
  typeof scheduleResearchThemeBodySchema
>;
