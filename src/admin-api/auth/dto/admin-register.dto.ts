import { z } from 'zod';
import { adminPasswordSchema } from '../admin-password-policy';

export const adminRegisterBodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  userName: z.string().regex(/^[a-zA-Z0-9_-]{3,50}$/),
  email: z.email(),
  password: adminPasswordSchema,
});

export type AdminRegisterBody = z.infer<typeof adminRegisterBodySchema>;
