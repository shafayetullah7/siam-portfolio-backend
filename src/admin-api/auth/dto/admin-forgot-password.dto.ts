import { z } from 'zod';

export const adminForgotPasswordBodySchema = z.object({
  email: z.string().email(),
});

export type AdminForgotPasswordBody = z.infer<
  typeof adminForgotPasswordBodySchema
>;
