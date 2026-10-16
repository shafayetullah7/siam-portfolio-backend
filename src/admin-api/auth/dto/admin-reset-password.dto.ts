import { z } from 'zod';
import { adminPasswordSchema } from '../admin-password-policy';

export const adminResetPasswordBodySchema = z.object({
  token: z.string().min(20),
  password: adminPasswordSchema,
});

export type AdminResetPasswordBody = z.infer<
  typeof adminResetPasswordBodySchema
>;
