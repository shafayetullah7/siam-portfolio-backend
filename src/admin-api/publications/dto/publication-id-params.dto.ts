import { z } from 'zod';

export const publicationIdParamSchema = z.string().uuid();
