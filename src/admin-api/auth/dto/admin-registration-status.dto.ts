import { z } from 'zod';

export const adminRegistrationStatusSchema = z
  .object({
    registrationEnabled: z.boolean(),
    hasPending: z.boolean(),
    otpExpiresAt: z.string().optional(),
    locked: z.boolean().optional(),
    nextResendAt: z.string().optional(),
  })
  .meta({ title: 'AdminRegistrationStatus' });

export type AdminRegistrationStatusDto = z.infer<
  typeof adminRegistrationStatusSchema
>;
