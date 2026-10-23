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

describe('TimelineService.listPublishedByKinds', () => {
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
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([published, draft]),
          }),
        }),
      }),
    };
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
