import { describe, expect, it } from 'vitest';
import { buildPaginationMeta, buildPaginatedResponse } from './paginated-response';

describe('paginated-response', () => {
  it('buildPaginationMeta computes totalPages', () => {
    expect(
      buildPaginationMeta({ page: 1, limit: 24, total: 0, itemCount: 0 }),
    ).toEqual({
      page: 1,
      limit: 24,
      itemCount: 0,
      total: 0,
      totalPages: 0,
    });
    expect(
      buildPaginationMeta({ page: 2, limit: 10, total: 25, itemCount: 5 }),
    ).toEqual({
      page: 2,
      limit: 10,
      itemCount: 5,
      total: 25,
      totalPages: 3,
    });
  });

  it('buildPaginatedResponse wraps items and meta', () => {
    expect(
      buildPaginatedResponse(['a'], { page: 1, limit: 10, total: 1 }),
    ).toEqual({
      items: ['a'],
      meta: {
        page: 1,
        limit: 10,
        itemCount: 1,
        total: 1,
        totalPages: 1,
      },
    });
  });
});
