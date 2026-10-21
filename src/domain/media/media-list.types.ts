import type { PaginatedResponse } from '../../common/pagination/paginated-response';
import type { media } from '../../db/schema/media';

export type MediaListQuery = {
  q?: string;
  mime?: string;
  imagesOnly?: boolean;
  page: number;
  limit: number;
};

export type MediaRow = typeof media.$inferSelect;

export type MediaListResult = PaginatedResponse<MediaRow>;
