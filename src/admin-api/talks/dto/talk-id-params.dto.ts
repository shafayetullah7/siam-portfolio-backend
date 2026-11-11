import { z } from 'zod';

export const talkIdParamSchema = z.string().uuid();
