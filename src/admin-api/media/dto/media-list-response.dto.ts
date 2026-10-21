import { z } from 'zod';
import { paginatedResponseSchema } from '../../../common/pagination/paginated-response';
import { mediaAdminResponseSchema } from './media-admin-response.dto';

export const mediaListResponseSchema = paginatedResponseSchema(
  mediaAdminResponseSchema,
).meta({ title: 'MediaListResponse' });

export type MediaListResponse = z.infer<typeof mediaListResponseSchema>;
