import { z } from 'zod';

export const messageIdParamSchema = z.uuid();

export type MessageIdParam = z.infer<typeof messageIdParamSchema>;
