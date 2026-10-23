import { describe, expect, it } from 'vitest';
import { normalizeContactCategories } from './normalize-contact-categories';

describe('normalizeContactCategories', () => {
  it('trims, drops empties, and dedupes preserving order', () => {
    expect(
      normalizeContactCategories([' Media ', '', 'Media', 'Speaking', '  ']),
    ).toEqual(['Media', 'Speaking']);
  });

  it('caps at 20 categories', () => {
    const many = Array.from({ length: 25 }, (_, i) => `Cat${i}`);
    expect(normalizeContactCategories(many)).toHaveLength(20);
  });
});
