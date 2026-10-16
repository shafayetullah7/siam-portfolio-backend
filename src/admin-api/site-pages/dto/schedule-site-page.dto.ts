import { z } from 'zod';

export const scheduleSitePageBodySchema = z.object({
  scheduledAt: z.string().datetime(),
});

export type ScheduleSitePageBody = z.infer<typeof scheduleSitePageBodySchema>;
