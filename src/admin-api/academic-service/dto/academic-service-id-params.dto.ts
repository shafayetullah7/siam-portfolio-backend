import { z } from 'zod';

export const academicServiceIdParamSchema = z.string().uuid();
