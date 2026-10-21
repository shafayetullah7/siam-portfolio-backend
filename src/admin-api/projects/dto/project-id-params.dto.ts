import { z } from 'zod';

export const projectIdParamSchema = z.string().uuid();
