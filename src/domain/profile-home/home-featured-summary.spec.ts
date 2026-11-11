import { describe, expect, it, vi } from 'vitest';
import { getHomeFeaturedSummary } from './home-featured-summary';
import { FEATURED_ON_HOME_CAPS } from './featured-on-home.constants';

describe('getHomeFeaturedSummary', () => {
  it('returns capped counts and publish flags', async () => {
    let call = 0;
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(async () => {
              call += 1;
              if (call === 1) {
                return [
                  {
                    id: 't1',
                    slug: 'theme-a',
                    title: 'Theme A',
                    publishStatus: 'published',
                    scheduledAt: null,
                  },
                  {
                    id: 't2',
                    slug: 'theme-b',
                    title: 'Theme B',
                    publishStatus: 'draft',
                    scheduledAt: null,
                  },
                ];
              }
              return [];
            }),
          })),
        })),
      })),
    };
    const summary = await getHomeFeaturedSummary(db as never);
    expect(summary.caps).toEqual(FEATURED_ON_HOME_CAPS);
    expect(summary.research).toHaveLength(2);
    expect(summary.research[0]?.appearsOnPublicHome).toBe(true);
    expect(summary.research[1]?.appearsOnPublicHome).toBe(false);
    expect(summary.publications).toEqual([]);
    expect(summary.projects).toEqual([]);
  });
});
