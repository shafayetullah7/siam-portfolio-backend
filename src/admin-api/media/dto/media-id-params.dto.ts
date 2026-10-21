import { z } from 'zod';

export const mediaIdParamSchema = z.uuid();

export type MediaIdParam = z.infer<typeof mediaIdParamSchema>;
