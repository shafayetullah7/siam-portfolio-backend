import { describe, expect, it } from 'vitest';
import { filterPublicImages } from './public-timeline.service';

describe('filterPublicImages', () => {
  it('drops images without alt and preserves sort order', () => {
    const filtered = filterPublicImages([
      {
        url: 'https://a.jpg',
        alt: '',
        caption: null,
        sortOrder: 0,
      },
      {
        url: 'https://b.jpg',
        alt: 'B',
        caption: null,
        sortOrder: 2,
      },
      {
        url: 'https://c.jpg',
        alt: 'C',
        caption: null,
        sortOrder: 1,
      },
    ]);
    expect(filtered).toHaveLength(2);
    expect(filtered.map((i) => i.sortOrder)).toEqual([1, 2]);
  });
});
