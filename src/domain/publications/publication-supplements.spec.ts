import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { normalizeSupplementInputs } from './publication-supplements';

describe('normalizeSupplementInputs', () => {
  it('assigns sort order and defaults kind', () => {
    const rows = normalizeSupplementInputs([
      { label: 'Code', url: 'https://github.com/org/repo', kind: 'code' },
      { label: 'Data', url: 'https://example.com/data.zip' },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].sortOrder).toBe(0);
    expect(rows[1].sortOrder).toBe(1);
    expect(rows[1].kind).toBe('other');
  });

  it('rejects non-https URLs', () => {
    expect(() =>
      normalizeSupplementInputs([
        { label: 'Bad', url: 'http://insecure.example' },
      ]),
    ).toThrow(BadRequestException);
  });

  it('skips fully empty rows', () => {
    expect(
      normalizeSupplementInputs([{ label: '', url: '' }]),
    ).toHaveLength(0);
  });
});
