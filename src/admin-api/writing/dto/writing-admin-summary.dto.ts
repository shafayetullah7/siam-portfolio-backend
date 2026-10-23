import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';

export const writingAdminSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  updatedAt: z.string(),
  readingTimeMinutes: z.number().int().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

export type WritingAdminSummary = z.infer<typeof writingAdminSummarySchema>;
