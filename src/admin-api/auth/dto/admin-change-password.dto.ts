import { z } from 'zod';
import { adminPasswordSchema } from '../admin-password-policy';

export const adminChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: adminPasswordSchema,
});

export type AdminChangePasswordBody = z.infer<
  typeof adminChangePasswordBodySchema
>;
