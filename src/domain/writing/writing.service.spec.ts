import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recomputeReadingStats } from './writing-reading-stats';
import { WritingService } from './writing.service';
import { articleRow } from './writing.test-helpers';

const mediaMock = {
  findById: vi.fn().mockResolvedValue({ alt: 'Cover alt' }),
};

function writingService(db: unknown): WritingService {
  return new WritingService(db as never, mediaMock as never);
}

beforeEach(() => {
  vi.spyOn(
    WritingService.prototype,
    'listUnpublishedLinkedPublicationTitles',
  ).mockResolvedValue([]);
  vi.spyOn(
    WritingService.prototype,
    'listUnpublishedLinkedProjectTitles',
  ).mockResolvedValue([]);
  vi.spyOn(
    WritingService.prototype,
    'listUnpublishedLinkedThemeTitles',
  ).mockResolvedValue([]);
  vi.spyOn(
    WritingService.prototype,
    'listUnpublishedLinkedRelatedArticleTitles',
  ).mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function publishableBody(): string {
  return Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
}

describe('recomputeReadingStats', () => {
  it('increases word count with longer body', () => {
    const short = recomputeReadingStats('one two');
    const long = recomputeReadingStats(
      'one two three four five six seven eight nine ten',
    );
    expect(long.wordCount).toBeGreaterThan(short.wordCount);
    expect(long.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe('WritingService.findByIdAdmin', () => {
  it('throws when missing', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    await expect(writingService(db).findByIdAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('WritingService.create', () => {
  it('throws ConflictException on duplicate slug', async () => {
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({ code: '23505' }),
        }),
      }),
    };
    await expect(
      writingService(db).create({
        slug: 'dup',
        title: 'T',
        summary: 'S',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sets reading stats from body', async () => {
    const inserted = articleRow({ body: 'word one two three four' });
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([inserted]),
        }),
      }),
    };
    const row = await writingService(db).create({
      slug: 'stats',
      title: 'T',
      summary: 'S',
      body: 'word one two three four',
    });
    expect(row.body).toBe('word one two three four');
  });
});

describe('WritingService.update', () => {
  it('recomputes reading stats when body changes', async () => {
    const existing = articleRow({ id: 'a1', body: 'short' });
    const updated = articleRow({
      id: 'a1',
      body: 'much longer body with many more words here',
      wordCount: 7,
      readingTimeMinutes: 1,
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
    };
    const row = await writingService(db).update('a1', {
      body: 'much longer body with many more words here',
    });
    expect(row.wordCount).toBe(7);
  });
});

describe('WritingService.findPublishedBySlug', () => {
  it('returns 404 for draft', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              articleRow({ slug: 'draft', publishStatus: 'draft' }),
            ]),
          }),
        }),
      }),
    };
    await expect(
      writingService(db).findPublishedBySlug('draft'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('WritingService.listPublishedPublic', () => {
  function mockListPublishedPublicDb(items: ReturnType<typeof articleRow>[], total: number) {
    const offset = vi.fn().mockResolvedValue(items);
    const limitFn = vi.fn().mockReturnValue({ offset });
    const orderBy = vi.fn().mockReturnValue({ limit: limitFn });
    const whereItems = vi.fn().mockReturnValue({ orderBy });
    const fromItems = vi.fn().mockReturnValue({ where: whereItems });
    const countWhere = vi.fn().mockResolvedValue([{ total }]);
    const fromCount = vi.fn().mockReturnValue({ where: countWhere });
    let selectCall = 0;
    const db = {
      select: vi.fn(() => {
        selectCall += 1;
        if (selectCall === 1) {
          return { from: fromCount };
        }
        return { from: fromItems };
      }),
    };
    return { db };
  }

  it('returns paginated meta and rows', async () => {
    const published = articleRow({
      slug: 'live',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const { db } = mockListPublishedPublicDb([published], 3);
    const result = await writingService(db).listPublishedPublic({
      page: 2,
      limit: 1,
    });
    expect(result.items).toHaveLength(1);
    expect(result.meta.page).toBe(2);
    expect(result.meta.total).toBe(3);
  });

  it('listPublished returns visible rows from paginated query', async () => {
    const published = articleRow({
      slug: 'live',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const { db } = mockListPublishedPublicDb([published], 1);
    const rows = await writingService(db).listPublished();
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('live');
  });
});

describe('WritingService.assertFeaturedOnHubQuota', () => {
  it('blocks second featured on hub', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 'other' }]),
        }),
      }),
    };
    const service = writingService(db);
    await expect(
      service.assertFeaturedOnHubQuota('new-id', true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('WritingService.assertPublishable', () => {
  it('requires non-empty body', () => {
    const service = writingService({} as never);
    expect(() =>
      service.assertPublishable(articleRow({ body: '   ' })),
    ).toThrow(BadRequestException);
  });
});

describe('WritingService.listAdmin', () => {
  it('returns paginated rows with meta', async () => {
    const draft = articleRow({ id: 'd1', publishStatus: 'draft' });
    const db = {
      select: vi.fn().mockImplementation((fields?: { total?: unknown }) => {
        if (fields && 'total' in fields) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ total: 1 }]),
            }),
          };
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue([draft]),
                }),
              }),
            }),
          }),
        };
      }),
    };
    const result = await writingService(db).listAdmin({
      publishStatus: 'draft',
      page: 1,
      limit: 24,
    });
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(24);
  });
});

describe('WritingService.adjacentPublishedSlugs', () => {
  it('returns prev and next slugs in publish order', async () => {
    const service = writingService({} as never);
    vi.spyOn(service, 'listPublishedSlugs').mockResolvedValue([
      'newest',
      'middle',
      'oldest',
    ]);
    const adjacent = await service.adjacentPublishedSlugs('middle');
    expect(adjacent).toEqual({ prevSlug: 'newest', nextSlug: 'oldest' });
  });

  it('returns empty when slug not in list', async () => {
    const service = writingService({} as never);
    vi.spyOn(service, 'listPublishedSlugs').mockResolvedValue(['only']);
    expect(await service.adjacentPublishedSlugs('missing')).toEqual({});
  });
});

describe('WritingService lifecycle', () => {
  it('publish sets publishedAt and status published', async () => {
    const row = articleRow({
      publishStatus: 'draft',
      body: publishableBody(),
      summary: 'Sum',
      tags: ['essay'],
      readingTimeMinutes: 2,
    });
    const updated = articleRow({
      ...row,
      publishStatus: 'published',
      publishedAt: new Date('2026-01-02'),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
    };
    const result = await writingService(db).publish(row.id, {
      confirmWarnings: true,
    });
    expect(result.publishStatus).toBe('published');
    expect(result.publishedAt).toBeTruthy();
  });

  it('publish throws when not publishable', async () => {
    const row = articleRow({ body: '' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    await expect(writingService(db).publish(row.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('unpublish clears publishedAt', async () => {
    const publishedAt = new Date('2026-01-01');
    const row = articleRow({
      publishStatus: 'published',
      publishedAt,
    });
    const updated = articleRow({
      ...row,
      publishStatus: 'draft',
      publishedAt: null,
      materiallyUpdatedAt: publishedAt,
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
    };
    const result = await writingService(db).unpublish(row.id);
    expect(result.publishStatus).toBe('draft');
    expect(result.publishedAt).toBeNull();
  });

  it('schedule rejects past scheduledAt', async () => {
    const row = articleRow();
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    await expect(
      writingService(db).schedule(row.id, new Date('2020-01-01')),
    ).rejects.toThrow(BadRequestException);
  });

  it('publishDueScheduled promotes due rows', async () => {
    const due = articleRow({
      id: 'due-1',
      publishStatus: 'scheduled',
      scheduledAt: new Date('2026-01-01'),
      body: publishableBody(),
      summary: 'S',
      title: 'Title',
      slug: 'due-slug',
      tags: ['essay'],
      readingTimeMinutes: 2,
    });
    function drizzleWhereResult(rows: ReturnType<typeof articleRow>[]) {
      return {
        limit: vi.fn().mockResolvedValue(rows),
        then(
          onFulfilled: (value: typeof rows) => unknown,
          onRejected?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve(rows).then(onFulfilled, onRejected);
        },
      };
    }
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => drizzleWhereResult([due])),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              articleRow({
                ...due,
                publishStatus: 'published',
                publishedAt: new Date(),
              }),
            ]),
          }),
        }),
      }),
    };
    const count = await writingService(db).publishDueScheduled(
      new Date('2026-06-01'),
    );
    expect(count).toBe(1);
  });
});

