import { z } from 'zod';

export const articleIdParamSchema = z.string().uuid();
