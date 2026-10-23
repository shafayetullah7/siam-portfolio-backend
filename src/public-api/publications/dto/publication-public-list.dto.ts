import type { z } from 'zod';
import { paginatedResponseSchema } from '../../../common/pagination/paginated-response';
import { publicationPublicCardSchema } from './publication-public-card.dto';

export const publicationPublicListSchema = paginatedResponseSchema(
  publicationPublicCardSchema,
).meta({ title: 'PublicationPublicList' });

export type PublicationPublicListDto = z.infer<
  typeof publicationPublicListSchema
>;
