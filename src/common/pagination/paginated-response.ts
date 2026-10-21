import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number().int().min(1),
  /** Requested page size (max items per page). */
  limit: z.number().int().min(1),
  /** Number of items returned in `items` on this page (≤ limit; smaller on the last page). */
  itemCount: z.number().int().min(0),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    meta: paginationMetaSchema,
  });
}

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

export function buildPaginationMeta(params: {
  page: number;
  limit: number;
  total: number;
  itemCount: number;
}): PaginationMeta {
  const { page, limit, total, itemCount } = params;
  const totalPages =
    limit > 0 ? Math.max(0, Math.ceil(total / limit)) : 0;
  return { page, limit, itemCount, total, totalPages };
}

export function buildPaginatedResponse<T>(
  items: T[],
  params: { page: number; limit: number; total: number },
): PaginatedResponse<T> {
  return {
    items,
    meta: buildPaginationMeta({ ...params, itemCount: items.length }),
  };
}
