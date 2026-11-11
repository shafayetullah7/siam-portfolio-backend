import { z } from 'zod';

export const scheduleTalkBodySchema = z.object({
  scheduledAt: z.string().datetime(),
  confirmWarnings: z.boolean().optional(),
});

export type ScheduleTalkBody = z.infer<typeof scheduleTalkBodySchema>;
