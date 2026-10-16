import { z } from 'zod';

export const adminRegisterResultSchema = z
  .object({
    pendingId: z.uuid(),
    otpExpiresAt: z.string(),
  })
  .meta({ title: 'AdminRegisterResult' });

export type AdminRegisterResultDto = z.infer<typeof adminRegisterResultSchema>;
