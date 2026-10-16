import { z } from 'zod';

export const adminMessageSchema = z
  .object({
    message: z.string(),
  })
  .meta({ title: 'AdminMessage' });

export type AdminMessageDto = z.infer<typeof adminMessageSchema>;

export const adminOkSchema = z
  .object({
    ok: z.literal(true),
  })
  .meta({ title: 'AdminOk' });
