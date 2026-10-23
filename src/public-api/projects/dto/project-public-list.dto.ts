import { z } from 'zod';
import { paginatedResponseSchema } from '../../../common/pagination/paginated-response';
import { projectPublicCardSchema } from './project-public-card.dto';

export const projectPublicListSchema = paginatedResponseSchema(
  projectPublicCardSchema,
)
  .extend({
    intro: z.string().nullable(),
  })
  .meta({ title: 'ProjectPublicList' });

export type ProjectPublicListDto = z.infer<typeof projectPublicListSchema>;
