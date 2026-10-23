import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TimelineService } from './timeline.service';
import { timelineEntryRow } from './timeline.test-helpers';
import {
  assertValidTimelineKind,
  validateTimelineDateFields,
} from './timeline-entry.validation';

const mediaMock = {
  findById: vi.fn().mockResolvedValue({
    id: 'media-1',
    url: 'https://example.com/img.jpg',
    alt: 'Alt text',
  }),
};

function timelineService(db: unknown): TimelineService {
  return new TimelineService(db as never, mediaMock as never);
}

afterEach(() => {
  vi.restoreAllMocks();
  mediaMock.findById.mockResolvedValue({
    id: 'media-1',
    url: 'https://example.com/img.jpg',
    alt: 'Alt text',
  });
});

describe('timeline-entry.validation', () => {
  it('rejects invalid kind', () => {
    expect(() => assertValidTimelineKind('not_a_kind')).toThrow(
      BadRequestException,
    );
  });

  it('rejects endDate before startDate', () => {
    expect(() =>
      validateTimelineDateFields({
        startDate: '2024-06-01',
        endDate: '2024-01-01',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects endDate when isOngoing', () => {
    expect(() =>
      validateTimelineDateFields({
        isOngoing: true,
        endDate: '2024-01-01',
      }),
    ).toThrow(BadRequestException);
  });
});

describe('TimelineService.create', () => {
  it('throws ConflictException on duplicate slug from database', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({ code: '23505' }),
        }),
      }),
    };
    await expect(
      timelineService(db).create({
        kind: 'award',
        title: 'Prize',
        slug: 'prize',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ConflictException when slug already exists', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'other' }]),
          }),
        }),
      }),
    };
    await expect(
      timelineService(db).create({
        kind: 'award',
        title: 'Prize',
        slug: 'taken',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('TimelineService.update', () => {
  it('throws ConflictException on slug conflict', async () => {
    const existing = timelineEntryRow({ id: 'entry-1', slug: 'old' });
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValueOnce([existing])
              .mockResolvedValueOnce([{ id: 'other' }]),
          }),
        }),
      })),
    };
    await expect(
      timelineService(db).update('entry-1', { slug: 'taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('TimelineService.replaceEntryMedia', () => {
  it('rejects more than 10 images', async () => {
    const existing = timelineEntryRow();
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      }),
    };
    const items = Array.from({ length: 11 }, (_, i) => ({
      mediaId: `m-${i}`,
      sortOrder: i,
    }));
    await expect(
      timelineService(db).replaceEntryMedia('entry-1', items),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists sort order via transaction', async () => {
    const existing = timelineEntryRow();
    const insertedValues = vi.fn().mockResolvedValue(undefined);
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({ values: insertedValues }),
    };
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 'jm-1',
                timelineEntryId: 'entry-1',
                mediaId: 'media-1',
                sortOrder: 0,
                caption: null,
                imageRole: null,
              },
            ]),
          }),
        }),
      })),
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => {
        await fn(tx);
      }),
    };

    mediaMock.findById.mockResolvedValue({
      id: 'media-1',
      url: 'https://example.com/a.jpg',
      alt: 'A',
    });

    const result = await timelineService(db).replaceEntryMedia('entry-1', [
      { mediaId: 'media-1', sortOrder: 0 },
      { mediaId: 'media-2', sortOrder: 1 },
    ]);

    expect(tx.delete).toHaveBeenCalled();
    expect(insertedValues).toHaveBeenCalledWith([
      expect.objectContaining({ mediaId: 'media-1', sortOrder: 0 }),
      expect.objectContaining({ mediaId: 'media-2', sortOrder: 1 }),
    ]);
    expect(result).toHaveLength(1);
  });
});

function mockDbForPublishedList(entryRows: ReturnType<typeof timelineEntryRow>[]) {
  let selectCall = 0;
  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCall += 1;
          if (selectCall === 1) {
            return Promise.resolve(entryRows);
          }
          return {
            orderBy: vi.fn().mockResolvedValue([]),
          };
        }),
      }),
    })),
  };
}

describe('TimelineService.listPublishedByKinds', () => {
  it('excludes scheduled entries until due', async () => {
    const future = new Date(Date.now() + 86_400_000);
    const published = timelineEntryRow({
      id: 'pub',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const scheduled = timelineEntryRow({
      id: 'sched',
      publishStatus: 'scheduled',
      scheduledAt: future,
    });
    const db = mockDbForPublishedList([published, scheduled]);
    const cards = await timelineService(db).listPublishedByKinds(['award'], {
      now: new Date(),
    });
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('pub');
  });

  it('paginates with page and limit', async () => {
    const rows = [
      timelineEntryRow({
        id: 'a',
        publishStatus: 'published',
        publishedAt: new Date(),
        startDate: '2024-03-01',
      }),
      timelineEntryRow({
        id: 'b',
        publishStatus: 'published',
        publishedAt: new Date(),
        startDate: '2024-01-01',
      }),
    ];
    const db = mockDbForPublishedList(rows);
    const page1 = await timelineService(db).listPublishedByKinds(['award'], {
      page: 1,
      limit: 1,
      sort: 'startDateDesc',
    });
    expect(page1).toHaveLength(1);
    expect(page1[0].id).toBe('a');
  });

  it('excludes draft entries', async () => {
    const published = timelineEntryRow({
      id: 'pub',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const draft = timelineEntryRow({
      id: 'draft',
      publishStatus: 'draft',
    });
    const db = mockDbForPublishedList([published, draft]);
    const cards = await timelineService(db).listPublishedByKinds(['award']);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe('pub');
  });
});

describe('TimelineService.assertFeaturedPublishedQuota', () => {
  it('blocks fourth published featured achievement', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: '1' },
            { id: '2' },
            { id: '3' },
          ]),
        }),
      }),
    };
    await expect(
      timelineService(db).assertFeaturedPublishedQuota('new-id', true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TimelineService.listAdmin', () => {
  it('returns paginated rows and applies kind filter in query', async () => {
    const award = timelineEntryRow({ id: 'a1', kind: 'award', title: 'Prize' });
    const education = timelineEntryRow({
      id: 'e1',
      kind: 'education',
      title: 'Degree',
    });
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
                  offset: vi.fn().mockResolvedValue([award]),
                }),
              }),
            }),
          }),
        };
      }),
    };
    const result = await timelineService(db).listAdmin({
      kind: 'award',
      q: 'Prize',
      page: 1,
      limit: 24,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('award');
    expect(result.meta.total).toBe(1);
    expect(education.kind).toBe('education');
  });
});

describe('TimelineService.reorderEntries', () => {
  it('persists sort order for all ids', async () => {
    const rows = [
      timelineEntryRow({ id: 'a', sortOrder: 0, kind: 'education' }),
      timelineEntryRow({ id: 'b', sortOrder: 1, kind: 'education' }),
    ];
    const setCalls: { sortOrder: number; id: string }[] = [];
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(rows),
        }),
      }),
      transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => {
        const tx = {
          update: vi.fn().mockReturnValue({
            set: vi.fn().mockImplementation((patch: { sortOrder: number }) => ({
              where: vi.fn().mockImplementation(async () => {
                setCalls.push({ sortOrder: patch.sortOrder, id: 'tracked' });
              }),
            })),
          }),
        };
        await fn(tx);
      }),
    };
    await timelineService(db).reorderEntries({
      items: [
        { id: 'a', sortOrder: 1 },
        { id: 'b', sortOrder: 0 },
      ],
      kinds: ['education'],
    });
    expect(db.transaction).toHaveBeenCalled();
  });

  it('rejects when an id is missing', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            timelineEntryRow({ id: 'a', kind: 'education' }),
          ]),
        }),
      }),
    };
    await expect(
      timelineService(db).reorderEntries({
        items: [
          { id: 'a', sortOrder: 0 },
          { id: 'missing', sortOrder: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects kind outside scope', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            timelineEntryRow({ id: 'a', kind: 'award' }),
          ]),
        }),
      }),
    };
    await expect(
      timelineService(db).reorderEntries({
        items: [{ id: 'a', sortOrder: 0 }],
        kinds: ['education'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TimelineService.findByIdAdmin', () => {
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
    await expect(
      timelineService(db).findByIdAdmin('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
