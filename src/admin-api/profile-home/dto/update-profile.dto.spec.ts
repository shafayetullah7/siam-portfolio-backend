import { describe, expect, it } from 'vitest';
import { updateProfileBodySchema } from './update-profile.dto';

describe('updateProfileBodySchema', () => {
  it('accepts partial identity fields', () => {
    const parsed = updateProfileBodySchema.parse({
      displayName: 'Ada',
      scholarlyProfiles: [{ label: 'ORCID', href: 'https://orcid.org/x' }],
    });
    expect(parsed.displayName).toBe('Ada');
  });

  it('rejects publishStatus', () => {
    expect(() =>
      updateProfileBodySchema.parse({ publishStatus: 'published' }),
    ).toThrow();
  });
});
