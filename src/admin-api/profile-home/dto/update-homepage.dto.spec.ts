import { describe, expect, it } from 'vitest';
import { updateHomepageBodySchema } from './update-homepage.dto';

describe('updateHomepageBodySchema', () => {
  it('accepts valid sections', () => {
    const parsed = updateHomepageBodySchema.parse({
      sections: [{ id: 'hero', visible: true }],
      heroDescriptor: 'Researcher',
    });
    expect(parsed.sections).toHaveLength(1);
  });

  it('rejects publishStatus', () => {
    expect(() =>
      updateHomepageBodySchema.parse({ publishStatus: 'published' }),
    ).toThrow();
  });

  it('rejects unknown keys', () => {
    expect(() =>
      updateHomepageBodySchema.parse({ unknownField: true }),
    ).toThrow();
  });
});
