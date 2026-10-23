import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { timelinePublicCardSchema } from './timeline-public-card.dto';

export const timelinePublicDetailSchema = timelinePublicCardSchema.extend({
  summary: z.string().nullable(),
  rankOrPlacement: z.string().nullable(),
  eventName: z.string().nullable(),
  credentialId: z.string().nullable(),
  expiresAt: z.string().nullable(),
  isCurrent: z.boolean().nullable(),
  publicationId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  publishedAt: z.string().nullable(),
});

export type TimelinePublicDetailDto = z.infer<typeof timelinePublicDetailSchema>;
