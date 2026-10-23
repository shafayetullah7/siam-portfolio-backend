import { z } from 'zod';
import { LIST_PUBLIC_TIMELINE_SORTS } from '../../../domain/timeline/timeline.types';
import { timelineEntryKindSchema } from '../../../admin-api/timeline/dto/timeline-entry-kind.schema';

function coerceKindsArray(val: unknown): string[] | undefined {
  if (val === undefined || val === null || val === '') {
    return undefined;
  }
  if (Array.isArray(val)) {
    return val.map(String);
  }
  return [String(val)];
}

export const listPublicTimelineQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sort: z.enum(LIST_PUBLIC_TIMELINE_SORTS).optional(),
  kind: timelineEntryKindSchema.optional(),
  kinds: z.preprocess(
    coerceKindsArray,
    z.array(timelineEntryKindSchema).optional(),
  ),
});

export type ListPublicTimelineQuery = z.infer<
  typeof listPublicTimelineQuerySchema
>;
