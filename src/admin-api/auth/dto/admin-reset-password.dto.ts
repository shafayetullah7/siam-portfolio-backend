import { z } from 'zod';

export const adminResetPasswordBodySchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8),
});

export type AdminResetPasswordBody = z.infer<
  typeof adminResetPasswordBodySchema
>;
