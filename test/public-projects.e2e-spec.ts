import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { MediaService } from '../src/domain/media/media.service';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ResearchService } from '../src/domain/research/research.service';
import { SiteService } from '../src/domain/site/site.service';
import { projectRow } from '../src/domain/projects/projects.service.spec';
import type { ProjectRow } from '../src/domain/projects/projects.types';
import { PublicProjectsController } from '../src/public-api/projects/public-projects.controller';
import { PublicProjectsService } from '../src/public-api/projects/public-projects.service';

describe('Public projects (e2e)', () => {
  let app: INestApplication<App>;
  const bySlug = new Map<string, ProjectRow>();
  const domain = new ProjectsService({} as never, {} as never, {} as never);

  const projectsMock: Partial<ProjectsService> = {
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = bySlug.get(slug);
      if (!row) {
        throw new NotFoundException('Project not found');
      }
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        )
      ) {
        throw new NotFoundException('Project not found');
      }
      return row;
    }),
    loadSectionsForProject: vi.fn(async (projectId: string) => {
      const row = [...bySlug.values()].find((r) => r.id === projectId);
      if (row?.slug === 'live') {
        return [
          {
            id: 's1',
            projectId,
            kind: 'problem' as const,
            title: null,
            body: 'Problem body',
            sortOrder: 0,
          },
          {
            id: 's2',
            projectId,
            kind: 'limitations' as const,
            title: null,
            body: 'Limits',
            sortOrder: 1,
          },
        ];
      }
      return [];
    }),
    loadResourcesForProject: vi.fn(async () => []),
    loadMetricsForProject: vi.fn(async () => []),
    adjacentPublishedSlugs: vi.fn(async (slug: string) => {
      const slugs = [...bySlug.values()]
        .filter((row) =>
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ),
        )
        .map((r) => r.slug);
      const index = slugs.indexOf(slug);
      if (index === -1) return {};
      return {
        ...(index > 0 ? { prevSlug: slugs[index - 1] } : {}),
        ...(index < slugs.length - 1 ? { nextSlug: slugs[index + 1] } : {}),
      };
    }),
    toPublicDetail: (row, sections, resources, metrics) =>
      domain.toPublicDetail(row, sections, resources, metrics),
    listPublishedPublic: vi.fn(async (query = {}) => {
      let rows = [...bySlug.values()].filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        ),
      );
      if (query.featured === true) {
        rows = rows.filter((row) => row.featured);
      }
      if (query.excludeFeatured === true) {
        rows = rows.filter((row) => !row.featured);
      }
      if (query.projectType) {
        rows = rows.filter((row) => row.projectType === query.projectType);
      }
      const tag = query.tag?.trim();
      if (tag) {
        rows = rows.filter((row) => row.tags?.includes(tag));
      }
      const q = query.q?.trim().toLowerCase();
      if (q) {
        rows = rows.filter(
          (row) =>
            row.title.toLowerCase().includes(q) ||
            row.summary.toLowerCase().includes(q) ||
            row.slug.toLowerCase().includes(q),
        );
      }
      const page = query.page ?? 1;
      const limit = query.limit ?? 24;
      const offset = (page - 1) * limit;
      const pageRows = rows.slice(offset, offset + limit);
      const items = pageRows.map((row) => domain.toPublicCard(row));
      return buildPaginatedResponse(items, {
        page,
        limit,
        total: rows.length,
      });
    }),
    listPublicationIdsForProject: vi.fn(async () => []),
    listThemeIdsForProject: vi.fn(async () => []),
    loadSectionMediaIdsBySectionIds: vi.fn(async () => new Map()),
    loadMediaByIds: vi.fn(async () => new Map()),
    attachSectionFiguresToPublicSections: vi.fn(
      (_rows: unknown, sections: unknown) => sections,
    ),
  };

  const publicationsMock = {
    listPublishedCardsByIds: vi.fn(async () => []),
  };

  const researchMock = {
    listPublishedThemeCardsByIds: vi.fn(async () => []),
  };

  const mediaMock = {
    findById: vi.fn(),
  };

  const siteMock = {
    getOrCreateSettings: vi.fn(async () => ({
      projectsHubIntro: 'Projects hub intro',
      researchHubIntro: null,
    })),
  };

  beforeEach(async () => {
    bySlug.clear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicProjectsController],
      providers: [
        PublicProjectsService,
        { provide: ProjectsService, useValue: projectsMock },
        { provide: MediaService, useValue: mediaMock },
        { provide: SiteService, useValue: siteMock },
        { provide: PublicationsService, useValue: publicationsMock },
        { provide: ResearchService, useValue: researchMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    vi.clearAllMocks();
  });

  it('lists only published projects', async () => {
    bySlug.set(
      'live',
      projectRow({
        slug: 'live',
        title: 'Live Project',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );
    bySlug.set(
      'draft-one',
      projectRow({
        slug: 'draft-one',
        title: 'Draft',
        publishStatus: 'draft',
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects')
      .expect(200);

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].slug).toBe('live');
    expect(res.body.data.meta.total).toBe(1);
    expect(res.body.data.intro).toBe('Projects hub intro');
  });

  it('returns 404 for unknown slug detail', async () => {
    await request(app.getHttpServer())
      .get('/public/projects/unknown-slug')
      .expect(404);
  });

  it('returns 404 for draft slug detail', async () => {
    bySlug.set(
      'draft-one',
      projectRow({
        slug: 'draft-one',
        publishStatus: 'draft',
      }),
    );

    await request(app.getHttpServer())
      .get('/public/projects/draft-one')
      .expect(404);
  });

  it('returns published detail with ordered sections', async () => {
    bySlug.set(
      'live',
      projectRow({
        slug: 'live',
        title: 'Live Project',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects/live')
      .expect(200);

    expect(res.body.data.title).toBe('Live Project');
    expect(res.body.data.sections.map((s: { body: string }) => s.body)).toEqual(
      ['Problem body', 'Limits'],
    );
  });

  it('returns related themes and publications when linked', async () => {
    const row = projectRow({
      slug: 'live',
      title: 'Live Project',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    bySlug.set('live', row);
    vi.mocked(projectsMock.listPublicationIdsForProject!).mockResolvedValueOnce([
      'pub-1',
    ]);
    vi.mocked(projectsMock.listThemeIdsForProject!).mockResolvedValueOnce([
      'theme-1',
    ]);
    vi.mocked(publicationsMock.listPublishedCardsByIds).mockResolvedValueOnce([
      {
        slug: 'paper-one',
        title: 'Paper One',
        authorsShort: 'A. Author',
        year: 2024,
        venue: 'ICML',
        href: '/publications/paper-one',
      },
    ]);
    vi.mocked(researchMock.listPublishedThemeCardsByIds).mockResolvedValueOnce([
      {
        slug: 'theme-one',
        title: 'Theme One',
        summary: 'S',
        href: '/research/theme-one',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/public/projects/live')
      .expect(200);

    expect(res.body.data.related).toEqual({
      themes: [
        {
          slug: 'theme-one',
          title: 'Theme One',
          summary: 'S',
          href: '/research/theme-one',
        },
      ],
      publications: [
        {
          slug: 'paper-one',
          title: 'Paper One',
          authorsShort: 'A. Author',
          year: 2024,
          venue: 'ICML',
          href: '/publications/paper-one',
        },
      ],
    });
  });

  it('returns adjacent slugs on detail', async () => {
    bySlug.set(
      'alpha',
      projectRow({
        slug: 'alpha',
        title: 'Alpha',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );
    bySlug.set(
      'beta',
      projectRow({
        slug: 'beta',
        title: 'Beta',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );
    bySlug.set(
      'gamma',
      projectRow({
        slug: 'gamma',
        title: 'Gamma',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects/beta')
      .expect(200);

    expect(res.body.data.prevSlug).toBe('alpha');
    expect(res.body.data.nextSlug).toBe('gamma');
  });

  it('filters featured on list query', async () => {
    bySlug.set(
      'featured-proj',
      projectRow({
        slug: 'featured-proj',
        title: 'Featured',
        publishStatus: 'published',
        publishedAt: new Date(),
        featured: true,
      }),
    );
    bySlug.set(
      'regular',
      projectRow({
        slug: 'regular',
        title: 'Regular',
        publishStatus: 'published',
        publishedAt: new Date(),
        featured: false,
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects?featured=true')
      .expect(200);

    expect(res.body.data.items.map((c: { slug: string }) => c.slug)).toEqual([
      'featured-proj',
    ]);
  });

  it('filters by projectType on list query', async () => {
    bySlug.set(
      'oss',
      projectRow({
        slug: 'oss',
        title: 'OSS',
        publishStatus: 'published',
        publishedAt: new Date(),
        projectType: 'open_source',
      }),
    );
    bySlug.set(
      'course',
      projectRow({
        slug: 'course',
        title: 'Course',
        publishStatus: 'published',
        publishedAt: new Date(),
        projectType: 'coursework',
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects?projectType=open_source')
      .expect(200);

    expect(res.body.data.items.map((c: { slug: string }) => c.slug)).toEqual([
      'oss',
    ]);
    expect(res.body.data.meta.total).toBe(1);
  });

  it('omits scheduled projects before due date', async () => {
    const future = new Date(Date.now() + 86400000);
    bySlug.set(
      'scheduled-later',
      projectRow({
        slug: 'scheduled-later',
        publishStatus: 'scheduled',
        scheduledAt: future,
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/public/projects')
      .expect(200);

    expect(res.body.data.items).toHaveLength(0);
  });
});
