import { z } from 'zod';

export const adminVerifyRegistrationBodySchema = z.object({
  otp: z.string().regex(/^\d{6}$/),
});

export type AdminVerifyRegistrationBody = z.infer<
  typeof adminVerifyRegistrationBodySchema
>;
