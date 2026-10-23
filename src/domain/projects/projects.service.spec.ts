import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service';
import type { ProjectResourceRow, ProjectRow } from './projects.types';

export function projectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'proj-1',
    slug: 'my-project',
    title: 'My Project',
    summary: 'Summary text',
    tags: null,
    projectType: 'other',
    projectStatus: 'completed',
    evaluationMaturity: 'provisional',
    ownerRole: null,
    ownerContribution: null,
    resultTeaser: null,
    periodStart: null,
    periodEnd: null,
    coverMediaId: null,
    featured: false,
    featuredOnHome: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    hideFromSearch: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProjectsService.findByIdAdmin', () => {
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
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await expect(service.findByIdAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ProjectsService.findManyByIds', () => {
  it('preserves caller order', async () => {
    const rowA = projectRow({ id: 'a', slug: 'a', title: 'A' });
    const rowB = projectRow({ id: 'b', slug: 'b', title: 'B' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([rowB, rowA]),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    const rows = await service.findManyByIds(['a', 'b']);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('ProjectsService.create with children', () => {
  it('inserts sections with sort order in a transaction', async () => {
    const inserted = projectRow({ id: 'p1', slug: 'with-sections' });
    const sectionValues: unknown[] = [];
    let insertCalls = 0;
    const tx = {
      insert: vi.fn(() => {
        insertCalls += 1;
        if (insertCalls === 1) {
          return {
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([inserted]),
            }),
          };
        }
        return {
          values: vi.fn((rows: unknown) => {
            sectionValues.push(rows);
            const batch = Array.isArray(rows) ? rows : [rows];
            return {
              returning: vi.fn().mockResolvedValue(
                batch.map((_, i) => ({ id: `sec-${i}` })),
              ),
            };
          }),
        };
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await service.create({
      slug: 'with-sections',
      title: 'T',
      summary: 'S',
      sections: [
        { kind: 'problem', body: 'P' },
        { kind: 'limitations', body: 'L' },
      ],
    });
    expect(db.transaction).toHaveBeenCalled();
    expect(sectionValues.length).toBeGreaterThan(0);
  });
});

function adminFindDb(row: ProjectRow) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([row]),
        }),
      }),
    }),
  };
}

describe('ProjectsService.update children', () => {
  it('replace-all sections on update', async () => {
    const row = projectRow({ id: 'p1' });
    const sectionInserts: unknown[] = [];
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn((v: unknown) => {
          sectionInserts.push(v);
          const batch = Array.isArray(v) ? v : [v];
          return {
            returning: vi.fn().mockResolvedValue(
              batch.map((_, i) => ({ id: `sec-${i}` })),
            ),
          };
        }),
      }),
    };
    const db = {
      ...adminFindDb(row),
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await service.update('p1', {
      sections: [
        { kind: 'problem', body: 'A' },
        { kind: 'limitations', body: 'B' },
      ],
    });
    expect(tx.delete).toHaveBeenCalled();
    expect(sectionInserts).toHaveLength(1);
    const batch = sectionInserts[0] as { sortOrder: number }[];
    expect(batch.map((s) => s.sortOrder)).toEqual([0, 1]);
  });

  it('replace-all metrics preserves sortOrder from input order', async () => {
    const row = projectRow({ id: 'p1' });
    const metricInserts: unknown[] = [];
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn((v: unknown) => {
          metricInserts.push(v);
          return Promise.resolve();
        }),
      }),
    };
    const db = {
      ...adminFindDb(row),
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await service.update('p1', {
      metrics: [
        { name: 'B', value: '2' },
        { name: 'A', value: '1' },
      ],
    });
    expect(metricInserts).toHaveLength(1);
    const batch = metricInserts[0] as { name: string; sortOrder: number }[];
    expect(batch.map((m) => m.name)).toEqual(['B', 'A']);
    expect(batch.map((m) => m.sortOrder)).toEqual([0, 1]);
  });

  it('clears sections when sections is empty array', async () => {
    const row = projectRow({ id: 'p1' });
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn();
    const tx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    const db = {
      ...adminFindDb(row),
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await service.update('p1', { sections: [] });
    expect(tx.delete).toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });
});

describe('ProjectsService.create cover media', () => {
  it('validates cover media id on create', async () => {
    const media = {
      assertImageMediaId: vi
        .fn()
        .mockRejectedValue(new BadRequestException('Cover must be an image')),
    };
    const service = new ProjectsService({} as never, media as never, {} as never);
    await expect(
      service.create({
        slug: 'new-proj',
        title: 'New',
        summary: 'S',
        coverMediaId: 'bad-media',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(media.assertImageMediaId).toHaveBeenCalledWith('bad-media');
  });
});

describe('ProjectsService.create', () => {
  it('inserts a draft row', async () => {
    const inserted = projectRow({ slug: 'new-proj', title: 'New' });
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([inserted]),
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
      transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) =>
        fn({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([inserted]),
            }),
          }),
        }),
      ),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    const result = await service.create({
      slug: 'new-proj',
      title: 'New',
      summary: 'S',
    });
    expect(result.slug).toBe('new-proj');
    expect(db.transaction).toHaveBeenCalled();
  });

  it('throws ConflictException on unique violation', async () => {
    const db = {
      transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) =>
        fn({
          insert: vi.fn().mockReturnValue({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockRejectedValue({ code: '23505' }),
            }),
          }),
        }),
      ),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await expect(
      service.create({ slug: 'dup', title: 'T', summary: 'S' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('ProjectsService.findPublishedBySlug', () => {
  it('returns 404 for draft', async () => {
    const row = projectRow({ publishStatus: 'draft' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await expect(service.findPublishedBySlug('my-project')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns published row', async () => {
    const row = projectRow({
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
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await expect(service.findPublishedBySlug('my-project')).resolves.toEqual(row);
  });
});

describe('ProjectsService.adjacentPublishedSlugs', () => {
  it('returns neighbors in published order', async () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    vi.spyOn(service, 'listPublishedSlugs').mockResolvedValue([
      'alpha',
      'beta',
      'gamma',
    ]);
    await expect(service.adjacentPublishedSlugs('beta')).resolves.toEqual({
      prevSlug: 'alpha',
      nextSlug: 'gamma',
    });
    await expect(service.adjacentPublishedSlugs('missing')).resolves.toEqual(
      {},
    );
  });
});

describe('ProjectsService.listPublished', () => {
  it('excludes draft and archived', async () => {
    const published = projectRow({
      slug: 'pub',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const draft = projectRow({ slug: 'draft', publishStatus: 'draft' });
    const archived = projectRow({ slug: 'arch', publishStatus: 'archived' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([draft, published, archived]),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    const rows = await service.listPublished();
    expect(rows.map((r) => r.slug)).toEqual(['pub']);
  });
});

describe('ProjectsService.assertFeaturedOnHomeQuota', () => {
  it('rejects when quota exceeded', async () => {
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
    const service = new ProjectsService(db as never, {} as never, {} as never);
    await expect(
      service.assertFeaturedOnHomeQuota(undefined, true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ProjectsService.listPublishedPublic', () => {
  function mockListPublishedPublicDb(items: ProjectRow[], total: number) {
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
    return { db, offset };
  }

  it('returns paginated meta and public cards', async () => {
    const published = projectRow({
      publishStatus: 'published',
      publishedAt: new Date(),
      slug: 'alpha',
    });
    const { db } = mockListPublishedPublicDb([published], 5);
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'loadResourcesForProjects').mockResolvedValue(new Map());
    const result = await service.listPublishedPublic({ page: 2, limit: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 2,
      limit: 1,
      itemCount: 1,
      total: 5,
      totalPages: 5,
    });
  });
});

describe('ProjectsService.listPublishedPublicCards', () => {
  it('filters featured, q, and attaches primaryResource', async () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    const featuredCard = {
      slug: 'alpha',
      title: 'Alpha ML',
      summary: 'S',
      href: '/projects/alpha',
      projectType: 'open_source' as const,
      projectStatus: 'completed' as const,
      primaryResource: {
        label: 'Code',
        url: 'https://github.com/example/a',
        resourceType: 'repo' as const,
      },
    };
    vi.spyOn(service, 'listPublishedPublic').mockImplementation(async (query) => {
      if (query.featured === true) {
        return {
          items: [featuredCard],
          meta: {
            page: 1,
            limit: 24,
            itemCount: 1,
            total: 1,
            totalPages: 1,
          },
        };
      }
      if (query.q === 'beta') {
        return {
          items: [
            {
              ...featuredCard,
              slug: 'beta',
              title: 'Beta tool',
            },
          ],
          meta: {
            page: 1,
            limit: 24,
            itemCount: 1,
            total: 1,
            totalPages: 1,
          },
        };
      }
      return {
        items: [],
        meta: {
          page: 1,
          limit: 24,
          itemCount: 0,
          total: 0,
          totalPages: 0,
        },
      };
    });

    const featuredOnly = await service.listPublishedPublicCards({
      featured: true,
    });
    expect(featuredOnly.map((c) => c.slug)).toEqual(['alpha']);
    expect(featuredOnly[0].primaryResource?.label).toBe('Code');

    const byQ = await service.listPublishedPublicCards({ q: 'beta' });
    expect(byQ.map((c) => c.slug)).toEqual(['beta']);
  });

  it('attaches coverUrl and coverAlt when cover media exists', async () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    vi.spyOn(service, 'listPublishedPublic').mockResolvedValue({
      items: [
        {
          slug: 'with-cover',
          title: 'T',
          summary: 'S',
          href: '/projects/with-cover',
          projectType: 'open_source',
          projectStatus: 'completed',
          coverUrl: 'https://cdn.example/cover.jpg',
          coverAlt: 'Cover alt',
        },
      ],
      meta: {
        page: 1,
        limit: 24,
        itemCount: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const cards = await service.listPublishedPublicCards();
    expect(cards[0].coverUrl).toBe('https://cdn.example/cover.jpg');
    expect(cards[0].coverAlt).toBe('Cover alt');
  });
});

describe('ProjectsService.toPublicCard', () => {
  it('includes primaryResource for repo link', () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    const row = projectRow();
    const resources: ProjectResourceRow[] = [
      {
        id: 'r1',
        projectId: row.id,
        sortOrder: 0,
        resourceType: 'repo',
        label: 'Source code',
        url: 'https://github.com/example/repo',
      },
    ];
    const card = service.toPublicCard(row, resources);
    expect(card.primaryResource?.resourceType).toBe('repo');
    expect(card.primaryResource?.label).toBe('Source code');
  });
});

describe('ProjectsService.assertPublishable', () => {
  it('delegates to publish rules', () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    expect(() =>
      service.assertPublishable(projectRow({ title: '  ' })),
    ).toThrow(BadRequestException);
  });
});

describe('ProjectsService.publish', () => {
  it('sets published status and timestamp', async () => {
    const row = projectRow({ id: 'p1', publishStatus: 'draft' });
    const published = projectRow({
      id: 'p1',
      publishStatus: 'published',
      publishedAt: new Date('2024-06-01'),
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
            returning: vi.fn().mockResolvedValue([published]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'getPublishChecklist').mockResolvedValue({
      errors: [],
      warnings: [],
    });
    const result = await service.publish('p1');
    expect(result.publishStatus).toBe('published');
    expect(result.publishedAt).toBeTruthy();
  });

  it('throws PUBLISH_BLOCKED when checklist has errors', async () => {
    const row = projectRow({ id: 'p1' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'getPublishChecklist').mockResolvedValue({
      errors: [{ code: 'problem_required', message: 'Add problem' }],
      warnings: [],
    });
    try {
      await service.publish('p1');
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe('PUBLISH_BLOCKED');
    }
  });

  it('throws PUBLISH_WARNINGS without confirmWarnings', async () => {
    const row = projectRow({ id: 'p1' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'getPublishChecklist').mockResolvedValue({
      errors: [],
      warnings: [{ code: 'no_repo_or_demo', message: 'No repo' }],
    });
    try {
      await service.publish('p1');
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe('PUBLISH_WARNINGS');
    }
  });

  it('rejects invalid overview', async () => {
    const row = projectRow({ id: 'p1', title: '  ' });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'getPublishChecklist').mockResolvedValue({
      errors: [{ code: 'title_required', message: 'Title is required' }],
      warnings: [],
    });
    try {
      await service.publish('p1');
      expect.fail('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe('PUBLISH_BLOCKED');
    }
  });
});

describe('ProjectsService.unpublish', () => {
  it('returns row to draft', async () => {
    const draft = projectRow({ id: 'p1', publishStatus: 'draft' });
    const db = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([draft]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    const result = await service.unpublish('p1');
    expect(result.publishStatus).toBe('draft');
    expect(result.publishedAt).toBeNull();
  });
});

describe('ProjectsService.schedule', () => {
  it('rejects past scheduledAt', async () => {
    const service = new ProjectsService({} as never, {} as never, {} as never);
    await expect(
      service.schedule('p1', new Date(Date.now() - 1000)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ProjectsService.publishDueScheduled', () => {
  it('publishes due scheduled rows', async () => {
    const due = projectRow({
      id: 'due-1',
      publishStatus: 'scheduled',
      scheduledAt: new Date(Date.now() - 1000),
    });
    const published = projectRow({
      id: 'due-1',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const dueRows = [due];
    const whereResult = Object.assign(Promise.resolve(dueRows), {
      limit: vi.fn().mockResolvedValue(dueRows),
    });
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(whereResult),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([published]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never, {} as never, {} as never);
    vi.spyOn(service, 'getPublishChecklist').mockResolvedValue({
      errors: [],
      warnings: [],
    });
    const count = await service.publishDueScheduled();
    expect(count).toBe(1);
    expect(db.update).toHaveBeenCalled();
  });
});

describe('ProjectsService.replacePublications', () => {
  it('replaces publication links in order', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      insert: vi.fn().mockReturnValue({ values: insertValues }),
    };
    const db = {
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => fn(tx)),
    };
    const publications = {
      assertAllExist: vi.fn().mockResolvedValue(undefined),
    };
    const service = new ProjectsService(
      db as never,
      {} as never,
      publications as never,
    );
    await service.replacePublications('p1', [
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    ]);
    expect(publications.assertAllExist).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith([
      expect.objectContaining({ projectId: 'p1', sortOrder: 0 }),
      expect.objectContaining({ sortOrder: 1 }),
    ]);
  });
});
