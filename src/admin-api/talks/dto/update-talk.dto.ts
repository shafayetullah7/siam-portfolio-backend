import { z } from 'zod';
import { createTalkBodySchema } from './create-talk.dto';

export const updateTalkBodySchema = createTalkBodySchema.partial();

export type UpdateTalkBody = z.infer<typeof updateTalkBodySchema>;
