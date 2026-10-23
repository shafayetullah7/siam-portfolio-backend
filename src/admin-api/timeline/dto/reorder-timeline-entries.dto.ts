import { z } from 'zod';
import { timelineEntryKindSchema } from './timeline-entry-kind.schema';

const reorderItemSchema = z.object({
  id: z.string().uuid(),
  sortOrder: z.number().int().min(0),
});

export const reorderTimelineEntriesBodySchema = z.object({
  items: z.array(reorderItemSchema).min(1),
  kinds: z.array(timelineEntryKindSchema).optional(),
});

export type ReorderTimelineEntriesBody = z.infer<
  typeof reorderTimelineEntriesBodySchema
>;
