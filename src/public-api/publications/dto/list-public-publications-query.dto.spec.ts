import { describe, expect, it } from 'vitest';
import { listPublicPublicationsQuerySchema } from './list-public-publications-query.dto';

describe('listPublicPublicationsQuerySchema', () => {
  it('parses year and type from query strings', () => {
    const parsed = listPublicPublicationsQuerySchema.parse({
      year: '2024',
      type: 'journal',
    });
    expect(parsed.year).toBe(2024);
    expect(parsed.type).toBe('journal');
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(24);
  });
});
