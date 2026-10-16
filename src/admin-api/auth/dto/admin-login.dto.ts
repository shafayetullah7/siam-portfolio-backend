import { z } from 'zod';

export const adminLoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AdminLoginBody = z.infer<typeof adminLoginBodySchema>;
