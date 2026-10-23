import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { timelineEntryKindSchema } from './timeline-entry-kind.schema';
import { timelineImageRoleSchema } from './timeline-image-role.schema';

export const timelineMediaLinkAdminSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
  sortOrder: z.number().int(),
  caption: z.string().nullable(),
  imageRole: timelineImageRoleSchema.nullable(),
  url: z.string().optional(),
  alt: z.string().nullable().optional(),
});

export const timelineAdminResponseSchema = z.object({
  id: z.string().uuid(),
  kind: timelineEntryKindSchema,
  slug: z.string().nullable(),
  title: z.string(),
  subtitle: z.string().nullable(),
  summary: z.string().nullable(),
  organization: z.string().nullable(),
  location: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  isOngoing: z.boolean(),
  isCurrent: z.boolean().nullable(),
  proofUrl: z.string().nullable(),
  rankOrPlacement: z.string().nullable(),
  eventName: z.string().nullable(),
  credentialId: z.string().nullable(),
  expiresAt: z.string().nullable(),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  publicationId: z.string().uuid().nullable(),
  projectId: z.string().uuid().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  hideFromSearch: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  publishStatus: z.enum(PUBLISH_STATUSES),
  publishedAt: z.string().nullable(),
  scheduledAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  mediaLinks: z.array(timelineMediaLinkAdminSchema),
});

export type TimelineMediaLinkAdmin = z.infer<typeof timelineMediaLinkAdminSchema>;
export type TimelineAdminResponse = z.infer<typeof timelineAdminResponseSchema>;
