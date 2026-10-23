import { z } from 'zod';

export const scheduleArticleBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type ScheduleArticleBody = z.infer<typeof scheduleArticleBodySchema>;
