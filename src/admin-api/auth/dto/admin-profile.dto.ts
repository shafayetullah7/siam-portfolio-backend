import { z } from 'zod';

export const adminProfileSchema = z
  .object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    userName: z.string(),
    email: z.string().email(),
    mfaEnabled: z.boolean(),
  })
  .meta({ title: 'AdminProfile' });

export type AdminProfileDto = z.infer<typeof adminProfileSchema>;
