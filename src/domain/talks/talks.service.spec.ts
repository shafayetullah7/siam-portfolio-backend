import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { assertRelationIdLimits } from './talk-relations';
import { CollaborationsService } from './collaborations.service';
import { TalksService } from './talks.service';
import { talkRow } from './talks.test-helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

function talksService(db: unknown): TalksService {
  return new TalksService(db as never);
}

const collabMediaMock = {
  assertImageMediaId: vi.fn().mockResolvedValue({}),
};

function collaborationsService(db: unknown): CollaborationsService {
  return new CollaborationsService(db as never, collabMediaMock as never);
}

describe('assertRelationIdLimits', () => {
  it('rejects more than 20 publication ids', () => {
    const ids = Array.from({ length: 21 }, (_, i) => `pub-${i}`);
    expect(() =>
      assertRelationIdLimits(ids, [], []),
    ).toThrow(BadRequestException);
  });
});

describe('TalksService.create', () => {
  it('throws ConflictException on duplicate slug', async () => {
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue({ code: '23505' }),
        }),
      }),
    };
    await expect(
      talksService(db).create({
        slug: 'dup',
        title: 'T',
        eventName: 'E',
        timezone: 'UTC',
        startsAt: new Date(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('forces draft publishStatus when role is attendee', async () => {
    const returning = vi.fn().mockResolvedValue([
      talkRow({ role: 'attendee', publishStatus: 'draft' }),
    ]);
    const values = vi.fn().mockReturnValue({ returning });
    const db = {
      insert: vi.fn().mockReturnValue({ values }),
    };
    const row = await talksService(db).create({
      slug: 'attendee-talk',
      title: 'T',
      eventName: 'E',
      timezone: 'UTC',
      startsAt: new Date(),
      role: 'attendee',
      publishStatus: 'published',
    });
    expect(row.publishStatus).toBe('draft');
    const inserted = values.mock.calls[0]![0] as { publishStatus: string };
    expect(inserted.publishStatus).toBe('draft');
  });
});

describe('TalksService.findPublishedBySlug', () => {
  it('throws for draft talk', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi
              .fn()
              .mockResolvedValue([talkRow({ publishStatus: 'draft' })]),
          }),
        }),
      }),
    };
    await expect(
      talksService(db).findPublishedBySlug('sample-talk'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns published talk', async () => {
    const published = talkRow({
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([published]),
          }),
        }),
      }),
    };
    const row = await talksService(db).findPublishedBySlug('sample-talk');
    expect(row.slug).toBe('sample-talk');
  });
});

describe('TalksService.listPublicHub', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('excludes draft and splits upcoming vs past', async () => {
    const upcoming = talkRow({
      id: 'up',
      slug: 'upcoming-talk',
      publishStatus: 'published',
      startsAt: new Date('2026-07-01T10:00:00.000Z'),
    });
    const past = talkRow({
      id: 'pa',
      slug: 'past-talk',
      publishStatus: 'published',
      startsAt: new Date('2026-01-01T10:00:00.000Z'),
    });
    const draft = talkRow({
      id: 'dr',
      slug: 'draft-talk',
      publishStatus: 'draft',
      startsAt: new Date('2026-07-02T10:00:00.000Z'),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([upcoming, past, draft]),
        }),
      }),
    };
    const hub = await talksService(db).listPublicHub(now);
    expect(hub.upcoming.map((c) => c.slug)).toEqual(['upcoming-talk']);
    expect(hub.past.map((c) => c.slug)).toEqual(['past-talk']);
  });

  it('includes scheduled talk after scheduledAt', async () => {
    const scheduled = talkRow({
      slug: 'scheduled-talk',
      publishStatus: 'scheduled',
      scheduledAt: new Date('2026-06-14T00:00:00.000Z'),
      startsAt: new Date('2026-08-01T10:00:00.000Z'),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([scheduled]),
        }),
      }),
    };
    const hub = await talksService(db).listPublicHub(now);
    expect(hub.upcoming).toHaveLength(1);
    expect(hub.upcoming[0]!.slug).toBe('scheduled-talk');
  });

  it('excludes scheduled talk before scheduledAt', async () => {
    const scheduled = talkRow({
      slug: 'future-scheduled',
      publishStatus: 'scheduled',
      scheduledAt: new Date('2026-12-01T00:00:00.000Z'),
      startsAt: new Date('2026-08-01T10:00:00.000Z'),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([scheduled]),
        }),
      }),
    };
    const hub = await talksService(db).listPublicHub(now);
    expect(hub.upcoming).toHaveLength(0);
    expect(hub.past).toHaveLength(0);
  });
});

describe('TalksService.listPublishedRelatedCardsForTheme', () => {
  const now = new Date('2026-06-01T12:00:00.000Z');

  it('returns published talks linked to theme in junction order', async () => {
    const published = {
      slug: 'keynote',
      title: 'Keynote',
      eventName: 'Summit',
      startsAt: new Date('2026-05-01T10:00:00.000Z'),
      talkType: 'invited_talk' as const,
      publishStatus: 'published' as const,
      scheduledAt: null,
    };
    const orderBy = vi.fn().mockResolvedValue([published]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    const db = { select: vi.fn().mockReturnValue({ from }) };

    const cards = await talksService(db).listPublishedRelatedCardsForTheme(
      'theme-1',
      now,
    );
    expect(cards).toHaveLength(1);
    expect(cards[0]).toEqual({
      slug: 'keynote',
      title: 'Keynote',
      eventName: 'Summit',
      startsAt: published.startsAt.toISOString(),
      talkType: 'invited_talk',
    });
  });

  it('excludes scheduled talk before scheduledAt even when junction exists', async () => {
    const scheduled = {
      slug: 'future',
      title: 'Future',
      eventName: 'Conf',
      startsAt: new Date('2026-08-01T10:00:00.000Z'),
      talkType: 'conference_talk' as const,
      publishStatus: 'scheduled' as const,
      scheduledAt: new Date('2026-12-01T00:00:00.000Z'),
    };
    const orderBy = vi.fn().mockResolvedValue([scheduled]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    const db = { select: vi.fn().mockReturnValue({ from }) };

    const cards = await talksService(db).listPublishedRelatedCardsForTheme(
      'theme-1',
      now,
    );
    expect(cards).toHaveLength(0);
  });
});

describe('TalksService.replaceTalkRelations', () => {
  it('rejects more than 20 theme ids', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([talkRow()]),
          }),
        }),
      }),
    };
    const themeIds = Array.from({ length: 21 }, (_, i) => `theme-${i}`);
    await expect(
      talksService(db).replaceTalkRelations('talk-1', { themeIds }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TalksService.listAdmin', () => {
  it('returns paginated items from db', async () => {
    const draft = talkRow({ id: 'd1', publishStatus: 'draft' });
    let selectCall = 0;
    const db = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1;
        if (selectCall === 1) {
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
    const result = await talksService(db).listAdmin({ publishStatus: 'draft' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.publishStatus).toBe('draft');
    expect(result.meta.total).toBe(1);
  });
});

describe('CollaborationsService.create', () => {
  it('creates with draft publishStatus', async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        id: 'c-1',
        partnerName: 'Lab',
        summary: 'Work',
        publishStatus: 'draft',
        institution: null,
        logoMediaId: null,
        role: null,
        period: null,
        outcomes: null,
        sortOrder: 0,
        publishedAt: null,
        scheduledAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const values = vi.fn().mockReturnValue({ returning });
    const insert = vi.fn().mockReturnValue({ values });
    const db = { insert };
    const row = await collaborationsService(db).create({
      partnerName: 'Lab',
      summary: 'Work',
      publishStatus: 'published',
    });
    expect(row.publishStatus).toBe('draft');
    const inserted = values.mock.calls[0]![0] as { publishStatus: string };
    expect(inserted.publishStatus).toBe('draft');
  });
});
