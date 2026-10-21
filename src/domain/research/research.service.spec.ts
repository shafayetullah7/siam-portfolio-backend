import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ResearchService } from './research.service';

function revisionsMock() {
  return {
    append: vi.fn().mockResolvedValue({ id: 'rev-1' }),
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn(),
  };
}

function mediaMock() {
  return {
    assertImageMediaId: vi.fn().mockResolvedValue({ id: 'media-1' }),
  };
}

function publicationsMock() {
  return {
    assertAllExist: vi.fn().mockResolvedValue(undefined),
    findManyByIds: vi.fn().mockResolvedValue([]),
    listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
    countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
  };
}

function projectsMock() {
  return {
    assertAllExist: vi.fn().mockResolvedValue(undefined),
    findManyByIds: vi.fn().mockResolvedValue([]),
    listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
    countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
  };
}

function researchService(
  db: unknown,
  revisions = revisionsMock(),
  media = mediaMock(),
  publicationCatalog = publicationsMock(),
  projectCatalog = projectsMock(),
) {
  return new ResearchService(
    db as never,
    revisions as never,
    media as never,
    publicationCatalog as never,
    projectCatalog as never,
  );
}

function dbWhereResult(options: {
  findRow?: unknown[];
  resourceRows?: unknown[];
}) {
  return {
    limit: vi.fn().mockResolvedValue(options.findRow ?? []),
    orderBy: vi.fn().mockResolvedValue(options.resourceRows ?? []),
  };
}

function withResourceListSelect(
  db: Record<string, unknown>,
  findRow?: unknown[],
  resourceRows: unknown[] = [],
) {
  const whereResult = dbWhereResult({ findRow, resourceRows });
  return {
    ...db,
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(whereResult),
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
  };
}

function publishableRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'theme-1',
    slug: 'my-theme',
    title: 'Title',
    summary: 'Summary',
    problem: 'Problem',
    objectives: 'Objectives',
    themeStatus: 'ongoing',
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    ...overrides,
  };
}

describe('ResearchService.findPublishedBySlug', () => {
  it('returns 404 for draft slug', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: '1',
                slug: 'draft-theme',
                publishStatus: 'draft',
                scheduledAt: null,
                title: 'T',
                summary: 'S',
                problem: 'P',
                themeStatus: 'ongoing',
              },
            ]),
          }),
        }),
      }),
    };
    const service = researchService(db);
    await expect(service.findPublishedBySlug('draft-theme')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns row when published', async () => {
    const row = {
      id: '1',
      slug: 'live',
      publishStatus: 'published',
      scheduledAt: null,
      title: 'T',
      summary: 'S',
      problem: 'P',
      themeStatus: 'ongoing',
    };
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([row]),
          }),
        }),
      }),
    };
    const service = researchService(db);
    await expect(service.findPublishedBySlug('live')).resolves.toEqual(row);
  });
});

describe('ResearchService.publish', () => {
  it('sets publishedAt when publishable', async () => {
    const row = publishableRow();
    const returning = vi.fn().mockResolvedValue([
      { ...row, publishStatus: 'published', publishedAt: new Date() },
    ]);
    const db = withResourceListSelect(
      {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning }),
          }),
        }),
      },
      [row],
    );
    const revisions = revisionsMock();
    const service = researchService(db, revisions);
    const result = await service.publish('theme-1');
    expect(revisions.append).toHaveBeenCalled();
    expect(result.publishStatus).toBe('published');
    expect(result.publishedAt).toBeInstanceOf(Date);
  });

  it('rejects publish when objectives missing for ongoing theme', async () => {
    const row = publishableRow({ objectives: '' });
    const db = withResourceListSelect({}, [row]);
    const service = researchService(db);
    await expect(service.publish('theme-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('requires confirmWarnings when checklist has warnings', async () => {
    const row = publishableRow({ findings: 'Preliminary results' });
    const update = vi.fn();
    const db = withResourceListSelect({ update }, [row]);
    const service = researchService(db);
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
    expect(update).not.toHaveBeenCalled();
  });

  it('publishes when warnings confirmed', async () => {
    const row = publishableRow({ findings: 'Preliminary results' });
    const returning = vi.fn().mockResolvedValue([
      { ...row, publishStatus: 'published', publishedAt: new Date() },
    ]);
    const db = withResourceListSelect(
      {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning }),
          }),
        }),
      },
      [row],
    );
    const service = researchService(db, revisionsMock());
    const result = await service.publish('theme-1', { confirmWarnings: true });
    expect(result.publishStatus).toBe('published');
  });
});

describe('ResearchService.publishDueScheduled', () => {
  it('calls publish for each due scheduled theme', async () => {
    const dueRow = publishableRow({
      publishStatus: 'scheduled',
      scheduledAt: new Date(Date.now() - 1000),
    });
    const service = researchService({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([dueRow]),
        }),
      }),
    });
    const publishSpy = vi
      .spyOn(service, 'publish')
      .mockResolvedValue(dueRow as never);
    const count = await service.publishDueScheduled();
    expect(count).toBe(1);
    expect(publishSpy).toHaveBeenCalledWith('theme-1');
  });
});

describe('ResearchService.create', () => {
  it('maps unique violation to ConflictException', async () => {
    const db = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('unique')),
        }),
      }),
    };
    const service = researchService(db);
    await expect(
      service.create({
        slug: 'x',
        title: 'T',
        summary: 'S',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('appends revision after successful create', async () => {
    const row = {
      ...publishableRow(),
      significance: null,
      objectives: 'Objectives',
      approach: null,
      findings: null,
      limitations: null,
      futureWork: null,
      tags: null,
      linkLabel: null,
      coverMediaId: null,
      sortOrder: 0,
      featuredOnHome: false,
      seoTitle: null,
      seoDescription: null,
      collaborators: null,
      acknowledgments: null,
      funding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const db = withResourceListSelect(
      {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([row]),
          }),
        }),
      },
      undefined,
    );
    const revisions = revisionsMock();
    const service = researchService(db, revisions);
    await service.create({ slug: 'x', title: 'T', summary: 'S' });
    expect(revisions.append).toHaveBeenCalledWith(
      'research_theme',
      'theme-1',
      expect.objectContaining({
        title: 'Title',
        resources: [],
        publicationIds: [],
        projectIds: [],
      }),
    );
  });
});

describe('ResearchService.featuredOnHome quota', () => {
  it('rejects enabling featured when six others already featured', async () => {
    const featuredRows = Array.from({ length: 6 }, (_, i) => ({
      id: `theme-${i}`,
    }));
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(featuredRows),
        }),
      }),
    };
    const service = researchService(db);
    await expect(
      service.assertFeaturedOnHomeQuota('new-theme', true),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('listPublishedFeaturedForHome excludes drafts', async () => {
    const published = publishableRow({
      publishStatus: 'published',
      publishedAt: new Date(),
      featuredOnHome: true,
    });
    const draft = publishableRow({
      id: 'theme-2',
      slug: 'draft',
      featuredOnHome: true,
      publishStatus: 'draft',
    });
    const service = researchService({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([published, draft]),
        }),
      }),
    });
    const rows = await service.listPublishedFeaturedForHome();
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('my-theme');
  });
});

describe('ResearchService.replaceResources', () => {
  it('rejects non-HTTPS URLs', async () => {
    const service = researchService({});
    await expect(
      service.replaceResources('theme-1', [
        { label: 'Repo', url: 'http://example.com/x', resourceType: 'code' },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('replaces rows in a transaction', async () => {
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const insertValues = vi.fn().mockResolvedValue(undefined);
    const tx = {
      delete: vi.fn().mockReturnValue({
        where: deleteWhere,
      }),
      insert: vi.fn().mockReturnValue({
        values: insertValues,
      }),
    };
    const db = {
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<void>) => {
        await fn(tx);
      }),
    };
    const service = researchService(db);
    await service.replaceResources('theme-1', [
      {
        label: 'Dataset',
        url: 'https://example.com/data',
        resourceType: 'data',
        sortOrder: 1,
      },
    ]);
    expect(deleteWhere).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith([
      expect.objectContaining({
        themeId: 'theme-1',
        label: 'Dataset',
        url: 'https://example.com/data',
        resourceType: 'data',
        sortOrder: 1,
      }),
    ]);
  });
});

describe('ResearchService.update coverMediaId', () => {
  it('rejects non-image cover media', async () => {
    const theme = publishableRow();
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([theme]),
          }),
        }),
      }),
      update: vi.fn(),
    };
    const media = mediaMock();
    media.assertImageMediaId.mockRejectedValue(
      new BadRequestException('Cover must be an image from the media library'),
    );
    const service = researchService(db, revisionsMock(), media);
    await expect(
      service.update('theme-1', {
        coverMediaId: '00000000-0000-4000-8000-000000000099',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('validates image id before update', async () => {
    const theme = publishableRow();
    const returning = vi.fn().mockResolvedValue([{ ...theme, coverMediaId: 'media-1' }]);
    const db = withResourceListSelect(
      {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning }),
          }),
        }),
      },
      [theme],
    );
    const media = mediaMock();
    const service = researchService(db, revisionsMock(), media);
    await service.update('theme-1', { coverMediaId: 'media-1' });
    expect(media.assertImageMediaId).toHaveBeenCalledWith('media-1');
  });
});

describe('ResearchService.restoreRevision', () => {
  it('applies snapshot and appends a new revision', async () => {
    const theme = {
      ...publishableRow({ title: 'Current' }),
      significance: null,
      approach: null,
      findings: null,
      limitations: null,
      futureWork: null,
      tags: null,
      linkLabel: null,
      coverMediaId: null,
      sortOrder: 0,
      featuredOnHome: false,
      seoTitle: null,
      seoDescription: null,
      collaborators: null,
      acknowledgments: null,
      funding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const restored = { ...theme, title: 'Restored', problem: 'Old problem' };
    const returning = vi.fn().mockResolvedValue([restored]);
    const db = withResourceListSelect(
      {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ returning }),
          }),
        }),
      },
      [theme],
    );
    const revisions = revisionsMock();
    revisions.getById.mockResolvedValue({
      id: 'rev-1',
      entityId: 'theme-1',
      snapshot: { title: 'Restored', problem: 'Old problem' },
    });
    const service = researchService(db, revisions);
    const result = await service.restoreRevision('theme-1', 'rev-1');
    expect(result.title).toBe('Restored');
    expect(revisions.append).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when revision belongs to another theme', async () => {
    const theme = publishableRow();
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([theme]),
          }),
        }),
      }),
    };
    const revisions = revisionsMock();
    revisions.getById.mockResolvedValue({
      id: 'rev-1',
      entityId: 'other-theme',
      snapshot: {},
    });
    const service = researchService(db, revisions);
    await expect(
      service.restoreRevision('theme-1', 'rev-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ResearchService.replacePublications', () => {
  it('rejects when over max links', async () => {
    const service = researchService({});
    const ids = Array.from({ length: 21 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    );
    await expect(service.replacePublications('theme-1', ids)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('ResearchService.replaceProjects', () => {
  it('rejects when over max links', async () => {
    const service = researchService({});
    const ids = Array.from({ length: 21 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    );
    await expect(service.replaceProjects('theme-1', ids)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
