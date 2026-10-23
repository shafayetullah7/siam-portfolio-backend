import { z } from 'zod';
import { timelineEntryKindSchema } from '../../../admin-api/timeline/dto/timeline-entry-kind.schema';
import { timelinePublicCardSchema } from './timeline-public-card.dto';

export const timelinePublicSectionSchema = z.object({
  kind: timelineEntryKindSchema,
  items: z.array(timelinePublicCardSchema),
});

export const timelinePublicGroupedListSchema = z.object({
  intro: z.string().nullable().optional(),
  sections: z.array(timelinePublicSectionSchema),
});

export type TimelinePublicSectionDto = z.infer<
  typeof timelinePublicSectionSchema
>;
export type TimelinePublicGroupedListDto = z.infer<
  typeof timelinePublicGroupedListSchema
>;
