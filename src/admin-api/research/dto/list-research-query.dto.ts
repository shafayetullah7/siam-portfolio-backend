import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const listResearchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  themeStatus: z.enum(['ongoing', 'completed']).optional(),
  featured: z.coerce.boolean().optional(),
});

export type ListResearchQuery = z.infer<typeof listResearchQuerySchema>;
