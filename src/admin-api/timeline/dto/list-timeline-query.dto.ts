import { z } from 'zod';
import { PUBLISH_STATUSES } from '../../../common/publishing/publish-status';
import { LIST_ADMIN_TIMELINE_SORTS } from '../../../domain/timeline/timeline.types';
import { coerceKindsArray } from './coerce-kinds-query';
import { timelineEntryKindSchema } from './timeline-entry-kind.schema';

export const listTimelineQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  kind: timelineEntryKindSchema.optional(),
  kinds: z.preprocess(coerceKindsArray, z.array(timelineEntryKindSchema).optional()),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_ADMIN_TIMELINE_SORTS).optional(),
});

export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;
