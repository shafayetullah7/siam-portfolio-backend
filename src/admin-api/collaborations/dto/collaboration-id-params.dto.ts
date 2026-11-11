import { z } from 'zod';

export const collaborationIdParamSchema = z.string().uuid();
