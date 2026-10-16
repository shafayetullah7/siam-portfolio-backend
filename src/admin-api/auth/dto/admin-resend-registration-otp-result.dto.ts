import { z } from 'zod';

export const adminResendRegistrationOtpResultSchema = z
  .object({
    otpExpiresAt: z.string(),
  })
  .meta({ title: 'AdminResendRegistrationOtpResult' });

export type AdminResendRegistrationOtpResultDto = z.infer<
  typeof adminResendRegistrationOtpResultSchema
>;
