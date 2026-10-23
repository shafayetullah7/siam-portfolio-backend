import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PublicationsService } from './publications.service';
import type { PublicationRow } from './publications.types';

export function publicationRow(
  overrides: Partial<PublicationRow> = {},
): PublicationRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: 'paper-one',
    title: 'Paper One',
    authorsShort: 'Author A',
    year: 2024,
    venue: 'NeurIPS',
    significance: null,
    abstract: null,
    publicationType: 'conference',
    peerReviewed: true,
    doi: null,
    publisherUrl: null,
    featured: false,
    featuredOnHome: false,
    seoTitle: null,
    seoDescription: null,
    ownerContribution: null,
    correctionNotice: null,
    hideFromSearch: false,
    pdfMediaId: null,
    openAccess: false,
    pdfRightsGranted: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('PublicationsService.findByIdAdmin', () => {
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
    const service = new PublicationsService(db as never, {} as never);
    await expect(service.findByIdAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('PublicationsService.create', () => {
  it('inserts a draft row and syncs authorsShort', async () => {
    const created = publicationRow({ authorsShort: 'Author A, Author B' });
    const db = {
      transaction: vi.fn(async (fn) =>
        fn({
          insert: vi
            .fn()
            .mockReturnValueOnce({
              values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([created]),
              }),
            })
            .mockReturnValueOnce({
              values: vi.fn().mockResolvedValue(undefined),
            }),
          delete: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      ),
    };
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.create({
      slug: 'paper-one',
      title: 'Paper One',
      authors: [{ name: 'Author A' }, { name: 'Author B' }],
      year: 2024,
      venue: 'NeurIPS',
    });
    expect(result.authorsShort).toBe('Author A, Author B');
    expect(db.transaction).toHaveBeenCalled();
  });

  it('throws ConflictException on unique violation', async () => {
    const db = {
      transaction: vi.fn(async (fn) =>
        fn({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue({ code: '23505' }),
            }),
          }),
        }),
      ),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(
      service.create({
        slug: 'dup',
        title: 'T',
        authors: [{ name: 'A' }],
        year: 2024,
        venue: 'V',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('PublicationsService.update', () => {
  it('throws when publication missing', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(
      service.update('missing', { title: 'New' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('PublicationsService.findPublishedBySlug', () => {
  it('returns 404 for draft', async () => {
    const row = publicationRow({ publishStatus: 'draft' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(service.findPublishedBySlug('paper-one')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns published row', async () => {
    const row = publicationRow({
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(service.findPublishedBySlug('paper-one')).resolves.toEqual(row);
  });
});

describe('PublicationsService.listPublished', () => {
  it('excludes draft and archived', async () => {
    const published = publicationRow({
      slug: 'pub',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const draft = publicationRow({ slug: 'draft', publishStatus: 'draft' });
    const archived = publicationRow({
      slug: 'arch',
      publishStatus: 'archived',
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([published, draft, archived]),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const rows = await service.listPublished();
    expect(rows.map((r) => r.slug)).toEqual(['pub']);
  });

  it('excludes scheduled publication before due time', async () => {
    const due = publicationRow({
      slug: 'due',
      publishStatus: 'scheduled',
      scheduledAt: new Date(Date.now() - 1000),
    });
    const future = publicationRow({
      slug: 'future',
      publishStatus: 'scheduled',
      scheduledAt: new Date(Date.now() + 60_000),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([due, future]),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const rows = await service.listPublished();
    expect(rows.map((r) => r.slug)).toEqual(['due']);
  });

  it('orders by year desc then title asc', async () => {
    const a = publicationRow({
      slug: 'a',
      year: 2023,
      title: 'Alpha',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const b = publicationRow({
      slug: 'b',
      year: 2024,
      title: 'Beta',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([b, a]),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const rows = await service.listPublished();
    expect(rows.map((r) => r.slug)).toEqual(['b', 'a']);
  });
});

describe('PublicationsService.findManyByIds', () => {
  it('preserves caller order', async () => {
    const rowA = publicationRow({ id: 'a', slug: 'a', title: 'A' });
    const rowB = publicationRow({ id: 'b', slug: 'b', title: 'B' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([rowB, rowA]),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const rows = await service.findManyByIds(['a', 'b']);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('PublicationsService.listAdmin filters', () => {
  it('applies year and publicationType in query', async () => {
    const row = publicationRow({
      year: 2024,
      publicationType: 'journal',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const limit = vi.fn().mockResolvedValue([row]);
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({ limit }),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const rows = await service.listAdmin({
      year: 2024,
      publicationType: 'journal',
    });
    expect(rows).toHaveLength(1);
    expect(limit).toHaveBeenCalled();
  });
});

describe('PublicationsService.publish', () => {
  it('sets publishedAt and status published', async () => {
    const draft = publicationRow({ publishStatus: 'draft' });
    const published = publicationRow({
      publishStatus: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    const selectLimit = vi.fn().mockResolvedValue([draft]);
    const returning = vi.fn().mockResolvedValue([published]);
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: selectLimit,
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.publish(draft.id, { confirmWarnings: true });
    expect(result.publishStatus).toBe('published');
    expect(result.publishedAt).toBeTruthy();
  });

  it('requires confirmWarnings when checklist has warnings', async () => {
    const draft = publicationRow({ publishStatus: 'draft' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([draft]),
          }),
        }),
      }),
      update: vi.fn(),
    };
    const service = new PublicationsService(db as never, {} as never);
    try {
      await service.publish('theme-1');
      expect.fail('expected publish to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code?: string;
      };
      expect(response.code).toBe('PUBLISH_WARNINGS');
    }
    expect(db.update).not.toHaveBeenCalled();
  });

  it('publishes when warnings confirmed', async () => {
    const draft = publicationRow({ publishStatus: 'draft' });
    const published = publicationRow({
      publishStatus: 'published',
      publishedAt: new Date('2026-01-01'),
    });
    const returning = vi.fn().mockResolvedValue([published]);
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([draft]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.publish(draft.id, { confirmWarnings: true });
    expect(result.publishStatus).toBe('published');
  });

  it('throws when not publishable', async () => {
    const draft = publicationRow({ title: '', publishStatus: 'draft' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([draft]),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(service.publish(draft.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('PublicationsService.unpublish', () => {
  it('moves published to draft', async () => {
    const draft = publicationRow({
      publishStatus: 'draft',
      publishedAt: null,
    });
    const returning = vi.fn().mockResolvedValue([draft]);
    const db = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.unpublish(draft.id);
    expect(result.publishStatus).toBe('draft');
    expect(result.publishedAt).toBeNull();
  });
});

describe('PublicationsService.schedule', () => {
  it('rejects past scheduledAt', async () => {
    const row = publicationRow();
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    await expect(
      service.schedule(row.id, new Date(Date.now() - 1000)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PublicationsService.publishDueScheduled', () => {
  it('publishes due scheduled rows', async () => {
    const due = publicationRow({
      id: 'due-id',
      publishStatus: 'scheduled',
      scheduledAt: new Date(Date.now() - 1000),
      abstract: 'Scheduled abstract',
      doi: '10.1234/scheduled',
    });
    const published = publicationRow({
      id: 'due-id',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const selectFrom = vi
      .fn()
      .mockReturnValueOnce({
        where: vi.fn().mockResolvedValue([due]),
      })
      .mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([due]),
        }),
      });
    const returning = vi.fn().mockResolvedValue([published]);
    const db = {
      select: vi.fn().mockReturnValue({ from: selectFrom }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({ returning }),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const count = await service.publishDueScheduled();
    expect(count).toBe(1);
  });
});

describe('PublicationsService.listPublishedPublic', () => {
  function mockListPublishedPublicDb(items: PublicationRow[], total: number) {
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
    return { db, offset, countWhere };
  }

  it('returns paginated meta and rows', async () => {
    const published = publicationRow({
      publishStatus: 'published',
      publishedAt: new Date(),
      year: 2024,
    });
    const { db } = mockListPublishedPublicDb([published], 3);
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.listPublishedPublic({ page: 2, limit: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 2,
      limit: 1,
      itemCount: 1,
      total: 3,
      totalPages: 3,
    });
  });

  it('uses theme join when themeSlug is set', async () => {
    const published = publicationRow({
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const offset = vi.fn().mockResolvedValue([{ publication: published }]);
    const limitFn = vi.fn().mockReturnValue({ offset });
    const orderBy = vi.fn().mockReturnValue({ limit: limitFn });
    const innerJoinThemes = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ orderBy }),
    });
    const innerJoinLinks = vi.fn().mockReturnValue({ innerJoin: innerJoinThemes });
    const fromItems = vi.fn().mockReturnValue({ innerJoin: innerJoinLinks });
    const countWhere = vi.fn().mockResolvedValue([{ total: 1 }]);
    const countInnerJoinThemes = vi.fn().mockReturnValue({ where: countWhere });
    const countInnerJoinLinks = vi.fn().mockReturnValue({
      innerJoin: countInnerJoinThemes,
    });
    const fromCount = vi.fn().mockReturnValue({ innerJoin: countInnerJoinLinks });
    let selectCall = 0;
    const db = {
      select: vi.fn(() => {
        selectCall += 1;
        return selectCall === 1 ? { from: fromCount } : { from: fromItems };
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const result = await service.listPublishedPublic({
      themeSlug: 'interpretability',
    });
    expect(result.items[0].slug).toBe(published.slug);
    expect(innerJoinLinks).toHaveBeenCalled();
  });
});

describe('PublicationsService.toPublicCard', () => {
  it('includes featured flag', () => {
    const service = new PublicationsService({} as never, {} as never);
    const card = service.toPublicCard(
      publicationRow({ featured: true, publishStatus: 'published' }),
    );
    expect(card.featured).toBe(true);
  });
});

describe('PublicationsService.toPublicDetail', () => {
  it('maps detail fields', () => {
    const service = new PublicationsService({} as never, {} as never);
    const detail = service.toPublicDetail(
      publicationRow({
        abstract: 'Abs',
        doi: '10.1234/example',
        publishStatus: 'published',
      }),
    );
    expect(detail.abstract).toBe('Abs');
    expect(detail.doi).toBe('10.1234/example');
    expect(detail.publicationType).toBe('conference');
  });

  it('includes ordered authors when provided', () => {
    const service = new PublicationsService({} as never, {} as never);
    const row = publicationRow();
    const detail = service.toPublicDetail(row, [
      {
        id: 'a1',
        publicationId: row.id,
        sortOrder: 0,
        name: 'First',
        affiliation: 'Uni',
        orcid: null,
      },
      {
        id: 'a2',
        publicationId: row.id,
        sortOrder: 1,
        name: 'Second',
        affiliation: null,
        orcid: null,
      },
    ]);
    expect(detail.authors).toEqual([
      { name: 'First', affiliation: 'Uni' },
      { name: 'Second' },
    ]);
  });
});

describe('PublicationsService.listPublishedFeaturedForHome', () => {
  it('returns only published rows flagged featuredOnHome up to limit', async () => {
    const rows = [
      publicationRow({
        slug: 'home-a',
        featuredOnHome: true,
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
      publicationRow({
        id: '00000000-0000-4000-8000-000000000002',
        slug: 'home-b',
        featuredOnHome: true,
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
      publicationRow({
        id: '00000000-0000-4000-8000-000000000003',
        slug: 'draft-featured',
        featuredOnHome: true,
        publishStatus: 'draft',
      }),
      publicationRow({
        id: '00000000-0000-4000-8000-000000000004',
        slug: 'not-featured',
        featuredOnHome: false,
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    ];
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(rows),
        }),
      }),
    };
    const service = new PublicationsService(db as never, {} as never);
    const featured = await service.listPublishedFeaturedForHome(2);
    expect(featured.map((r) => r.slug)).toEqual(['home-a', 'home-b']);
  });
});
