import { describe, expect, it } from 'vitest';
import { profileExpertiseSchema } from './profile-home-json.schemas';

describe('profileExpertiseSchema', () => {
  it('accepts bounded topic lists', () => {
    const parsed = profileExpertiseSchema.safeParse({
      domains: ['ML theory'],
      methodologies: ['Causal inference'],
      tooling: ['Python'],
      practices: ['Open science'],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects skill level objects', () => {
    const parsed = profileExpertiseSchema.safeParse({
      domains: [{ name: 'ML', level: 5 }],
      methodologies: [],
      tooling: [],
      practices: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects more than 12 topics per group', () => {
    const many = Array.from({ length: 13 }, (_, i) => `topic-${i}`);
    const parsed = profileExpertiseSchema.safeParse({
      domains: many,
      methodologies: [],
      tooling: [],
      practices: [],
    });
    expect(parsed.success).toBe(false);
  });
});
