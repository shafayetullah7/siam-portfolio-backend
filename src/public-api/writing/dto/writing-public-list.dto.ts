import { z } from 'zod';
import { paginatedResponseSchema } from '../../../common/pagination/paginated-response';
import { writingPublicCardSchema } from './writing-public-card.dto';

export const writingPublicListSchema = paginatedResponseSchema(
  writingPublicCardSchema,
)
  .extend({
    intro: z.string().nullable(),
  })
  .meta({ title: 'WritingPublicList' });

export type WritingPublicListDto = z.infer<typeof writingPublicListSchema>;
