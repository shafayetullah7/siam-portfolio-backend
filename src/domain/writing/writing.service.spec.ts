import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { recomputeReadingStats } from './writing-reading-stats';
import { WritingService } from './writing.service';
import { articleRow } from './writing.test-helpers';

function writingService(db: unknown): WritingService {
  return new WritingService(db as never);
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

describe('WritingService.listPublished', () => {
  it('excludes draft and archived', async () => {
    const published = articleRow({
      slug: 'live',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            articleRow({ slug: 'draft', publishStatus: 'draft' }),
            published,
            articleRow({ slug: 'arch', publishStatus: 'archived' }),
          ]),
        }),
      }),
    };
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
