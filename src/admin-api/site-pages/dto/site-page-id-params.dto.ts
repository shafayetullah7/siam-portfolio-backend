import { z } from 'zod';

export const sitePageIdParamSchema = z.uuid();

export type SitePageIdParam = z.infer<typeof sitePageIdParamSchema>;
