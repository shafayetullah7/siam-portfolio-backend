import { z } from 'zod';
import { createSitePageBodySchema } from './create-site-page.dto';

export const updateSitePageBodySchema = createSitePageBodySchema.partial();

export type UpdateSitePageBody = z.infer<typeof updateSitePageBodySchema>;
