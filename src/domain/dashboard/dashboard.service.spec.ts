import { describe, expect, it, vi } from 'vitest';
import { timelineEntries } from '../../db/schema/timeline/timeline-entries';
import { articles } from '../../db/schema/writing/articles';
import { projects } from '../../db/schema/projects';
import { publications } from '../../db/schema/publications';
import { sitePages } from '../../db/schema/site-pages';
import { media } from '../../db/schema/media';
import { DashboardService } from './dashboard.service';

describe('DashboardService.getCounts', () => {
  it('includes writing status counts', async () => {
    const writingByStatus: Record<string, number> = {
      draft: 2,
      published: 4,
      scheduled: 1,
      archived: 0,
    };
    let writingQuery = 0;
    let timelineQuery = 0;
    const timelineByStatus: Record<string, number> = {
      draft: 1,
      published: 3,
      scheduled: 0,
      archived: 1,
    };

    const db = {
      select: vi.fn(() => ({
        from: vi.fn((table: unknown) => {
          if (table === sitePages) {
            return Promise.resolve([]);
          }
          if (table === media) {
            return Promise.resolve([]);
          }
          if (table === publications || table === projects) {
            return {
              where: vi.fn().mockResolvedValue([{ total: 0 }]),
            };
          }
          if (table === timelineEntries) {
            timelineQuery += 1;
            const status = ['draft', 'published', 'scheduled', 'archived'][
              timelineQuery - 1
            ] as string;
            return {
              where: vi.fn().mockResolvedValue([
                { total: timelineByStatus[status] },
              ]),
            };
          }
          if (table === articles) {
            writingQuery += 1;
            const status = ['draft', 'published', 'scheduled', 'archived'][
              writingQuery - 1
            ] as string;
            return {
              where: vi.fn().mockResolvedValue([
                { total: writingByStatus[status] },
              ]),
            };
          }
          return Promise.resolve([]);
        }),
      })),
    };

    const counts = await new DashboardService(db as never).getCounts();
    expect(counts.writing).toEqual({
      draft: 2,
      published: 4,
      scheduled: 1,
      archived: 0,
    });
    expect(counts.timeline).toEqual({
      draft: 1,
      published: 3,
      scheduled: 0,
      archived: 1,
    });
  });
});
