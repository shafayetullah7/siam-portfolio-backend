import { z } from 'zod';
import { timelinePublicCardSchema } from './timeline-public-card.dto';

export const timelinePublicListMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});

export const timelinePublicListSchema = z.object({
  items: z.array(timelinePublicCardSchema),
  meta: timelinePublicListMetaSchema,
});

export type TimelinePublicListDto = z.infer<typeof timelinePublicListSchema>;
