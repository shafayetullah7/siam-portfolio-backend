import { z } from 'zod';

const RESERVED_SLUGS = new Set(['achievements', 'experience']);

export const timelineSlugParamSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .refine((slug) => !RESERVED_SLUGS.has(slug), {
    message: 'Invalid slug',
  });
