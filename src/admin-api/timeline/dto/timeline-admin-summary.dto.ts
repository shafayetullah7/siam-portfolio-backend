import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { timelineEntryKindSchema } from './timeline-entry-kind.schema';

export const timelineAdminSummarySchema = z.object({
  id: z.string().uuid(),
  kind: timelineEntryKindSchema,
  title: z.string(),
  slug: z.string().nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  organization: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isOngoing: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  updatedAt: z.string(),
});

export type TimelineAdminSummary = z.infer<typeof timelineAdminSummarySchema>;
