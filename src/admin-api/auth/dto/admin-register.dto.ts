import { z } from 'zod';

export const adminRegisterBodySchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  userName: z.string().regex(/^[a-zA-Z0-9_-]{3,50}$/),
  email: z.email(),
  password: z.string().min(8),
});

export type AdminRegisterBody = z.infer<typeof adminRegisterBodySchema>;
