import { z } from 'zod';
import { timelineImageRoleSchema } from './timeline-image-role.schema';

const MAX_ENTRY_MEDIA = 10;

export const replaceTimelineMediaItemSchema = z.object({
  mediaId: z.string().uuid(),
  sortOrder: z.coerce.number().int().min(0),
  caption: z.string().max(2000).optional().nullable(),
  imageRole: timelineImageRoleSchema.nullable().optional(),
});

export const replaceTimelineEntryMediaBodySchema = z.object({
  items: z.array(replaceTimelineMediaItemSchema).max(MAX_ENTRY_MEDIA),
});

export type ReplaceTimelineMediaItem = z.infer<
  typeof replaceTimelineMediaItemSchema
>;
export type ReplaceTimelineEntryMediaBody = z.infer<
  typeof replaceTimelineEntryMediaBodySchema
>;
