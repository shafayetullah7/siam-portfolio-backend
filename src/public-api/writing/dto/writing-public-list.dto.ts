import { z } from 'zod';
import { paginatedResponseSchema } from '../../../common/pagination/paginated-response';
import { writingPublicCardSchema } from './writing-public-card.dto';

const writingPublicSeriesSectionSchema = z.object({
  slug: z.string(),
  title: z.string(),
  summary: z.string().nullable().optional(),
  items: z.array(writingPublicCardSchema),
});

export const writingPublicListSchema = paginatedResponseSchema(
  writingPublicCardSchema,
)
  .extend({
    intro: z.string().nullable(),
    seriesSections: z.array(writingPublicSeriesSectionSchema).optional(),
  })
  .meta({ title: 'WritingPublicList' });

export type WritingPublicListDto = z.infer<typeof writingPublicListSchema>;
