import { z } from 'zod';

export const healthResponseSchema = z
  .object({
    status: z.literal('ok'),
    database: z.enum(['up', 'down']),
  })
  .meta({ title: 'HealthResponse' });

export type HealthResponseDto = z.infer<typeof healthResponseSchema>;
