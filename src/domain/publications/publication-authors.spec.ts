import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  formatAuthorsShort,
  normalizeAuthorInputs,
} from './publication-authors';

describe('formatAuthorsShort', () => {
  it('joins names in order', () => {
    expect(
      formatAuthorsShort([{ name: 'A' }, { name: 'B' }, { name: 'C' }]),
    ).toBe('A, B, C');
  });

  it('truncates to 300 characters', () => {
    const long = 'x'.repeat(200);
    const result = formatAuthorsShort([{ name: long }, { name: long }]);
    expect(result.length).toBe(300);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('normalizeAuthorInputs', () => {
  it('drops empty names and reindexes sortOrder', () => {
    const result = normalizeAuthorInputs([
      { name: 'First' },
      { name: '  ' },
      { name: 'Second' },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First');
    expect(result[1].name).toBe('Second');
    expect(result[1].sortOrder).toBe(1);
  });

  it('throws when no valid authors', () => {
    expect(() => normalizeAuthorInputs([{ name: '' }])).toThrow(
      BadRequestException,
    );
  });
});
