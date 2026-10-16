import { z } from 'zod';

export const sitePageSlugParamSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type SitePageSlugParam = z.infer<typeof sitePageSlugParamSchema>;
