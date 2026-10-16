import { z } from 'zod';

export const adminChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export type AdminChangePasswordBody = z.infer<
  typeof adminChangePasswordBodySchema
>;
