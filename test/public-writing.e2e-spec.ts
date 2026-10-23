import { INestApplication, NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { AppConfigService } from '../src/config/app-config.service';
import { MediaService } from '../src/domain/media/media.service';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ResearchService } from '../src/domain/research/research.service';
import { SiteService } from '../src/domain/site/site.service';
import { WritingService } from '../src/domain/writing/writing.service';
import { articleRow } from '../src/domain/writing/writing.test-helpers';
import type { ArticleRow } from '../src/domain/writing/writing.types';
import { PublicWritingController } from '../src/public-api/writing/public-writing.controller';
import { PublicWritingService } from '../src/public-api/writing/public-writing.service';

describe('Public writing (e2e)', () => {
  let app: INestApplication<App>;
  const bySlug = new Map<string, ArticleRow>();

  function visibleRows(): ArticleRow[] {
    return [...bySlug.values()].filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
      ),
    );
  }

  const writingMock: Partial<WritingService> = {
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = bySlug.get(slug);
      if (!row) {
        throw new NotFoundException('Article not found');
      }
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        )
      ) {
        throw new NotFoundException('Article not found');
      }
      return row;
    }),
    listPublishedPublic: vi.fn(async (query = {}) => {
      let rows = visibleRows();
      if (query.featuredOnHub === true) {
        rows = rows.filter((r) => r.featuredOnHub);
      }
      if (query.excludeFeaturedOnHub === true) {
        rows = rows.filter((r) => !r.featuredOnHub);
      }
      const page = Math.max(query.page ?? 1, 1);
      const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
      const offset = (page - 1) * limit;
      const slice = rows.slice(offset, offset + limit);
      return buildPaginatedResponse(slice, {
        page,
        limit,
        total: rows.length,
      });
    }),
    toPublicCard: vi.fn((row: ArticleRow) => {
      const service = new WritingService({} as never, {} as never);
      return service.toPublicCard(row);
    }),
    toPublicDetail: vi.fn((row: ArticleRow) => {
      const service = new WritingService({} as never, {} as never);
      return service.toPublicDetail(row);
    }),
    listPublishedSeriesSections: vi.fn(async () => []),
    adjacentPublishedSlugs: vi.fn(async (slug: string) => {
      const slugs = visibleRows()
        .sort(
          (a, b) =>
            (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
        )
        .map((r) => r.slug);
      const index = slugs.indexOf(slug);
      if (index === -1) return {};
      return {
        ...(index > 0 ? { prevSlug: slugs[index - 1] } : {}),
        ...(index < slugs.length - 1 ? { nextSlug: slugs[index + 1] } : {}),
      };
    }),
    adjacentInSeriesSlugs: vi.fn(async () => ({})),
    getSeriesById: vi.fn(async () => null),
    listPublicationIdsForArticle: vi.fn(async () => []),
    listProjectIdsForArticle: vi.fn(async () => []),
    listThemeIdsForArticle: vi.fn(async () => []),
    listRelatedArticleIdsForArticle: vi.fn(async () => []),
    listPublishedCardsByIds: vi.fn(async () => []),
  };

  const publicationsMock: Partial<PublicationsService> = {
    listPublishedCardsByIds: vi.fn(async () => []),
  };

  const projectsMock: Partial<ProjectsService> = {
    listPublishedCardsByIds: vi.fn(async () => []),
  };

  const researchMock: Partial<ResearchService> = {
    listPublishedThemeCardsByIds: vi.fn(async () => []),
  };

  const appConfigMock: Partial<AppConfigService> = {
    frontendUrl: 'http://localhost:5001',
  };

  const siteMock: Partial<SiteService> = {
    getOrCreateSettings: vi.fn().mockResolvedValue({
      writingHubIntro: 'Writing hub intro',
      projectsHubIntro: null,
      researchHubIntro: null,
      siteName: 'SIAM',
    }),
  };

  const mediaMock: Partial<MediaService> = {
    findById: vi.fn(async (id: string) => {
      if (id === 'media-with-alt') {
        return {
          id,
          url: 'https://cdn.example/cover.jpg',
          alt: 'Cover alt',
        } as never;
      }
      if (id === 'media-no-alt') {
        return {
          id,
          url: 'https://cdn.example/no-alt.jpg',
          alt: '   ',
        } as never;
      }
      throw new NotFoundException('Media not found');
    }),
  };

  beforeEach(async () => {
    bySlug.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicWritingController],
      providers: [
        PublicWritingService,
        { provide: WritingService, useValue: writingMock },
        { provide: PublicationsService, useValue: publicationsMock },
        { provide: ProjectsService, useValue: projectsMock },
        { provide: ResearchService, useValue: researchMock },
        { provide: MediaService, useValue: mediaMock },
        { provide: SiteService, useValue: siteMock },
        { provide: AppConfigService, useValue: appConfigMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists only published and due scheduled articles', async () => {
    bySlug.set(
      'live',
      articleRow({
        slug: 'live',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );
    bySlug.set('draft', articleRow({ slug: 'draft', publishStatus: 'draft' }));
    bySlug.set(
      'future',
      articleRow({
        slug: 'future',
        publishStatus: 'scheduled',
        scheduledAt: new Date(Date.now() + 60_000),
      }),
    );
    bySlug.set(
      'due',
      articleRow({
        slug: 'due',
        publishStatus: 'scheduled',
        scheduledAt: new Date(Date.now() - 1000),
        publishedAt: null,
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/public/writing')
      .expect(200);

    const slugs = res.body.data.items.map((c: { slug: string }) => c.slug);
    expect(slugs).toContain('live');
    expect(slugs).toContain('due');
    expect(slugs).not.toContain('draft');
    expect(slugs).not.toContain('future');
    expect(res.body.data.intro).toBe('Writing hub intro');
  });

  it('accepts series and sort query params', async () => {
    bySlug.set(
      'live',
      articleRow({
        slug: 'live',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    );

    await request(app.getHttpServer())
      .get('/api/v1/public/writing?series=unknown-series&sort=titleAsc')
      .expect(200);

    expect(writingMock.listPublishedPublic).toHaveBeenCalled();
  });

  it('returns detail for published slug and 404 for draft', async () => {
    bySlug.set(
      'live',
      articleRow({
        slug: 'live',
        publishStatus: 'published',
        publishedAt: new Date(),
        body: 'Article body',
      }),
    );
    bySlug.set('draft', articleRow({ slug: 'draft', publishStatus: 'draft' }));

    const detail = await request(app.getHttpServer())
      .get('/api/v1/public/writing/live')
      .expect(200);

    expect(detail.body.data.body).toBe('Article body');
    expect(detail.body.data.related).toEqual({
      articles: [],
      publications: [],
      projects: [],
      themes: [],
    });

    await request(app.getHttpServer())
      .get('/api/v1/public/writing/draft')
      .expect(404);
  });

  it('includes adjacent slugs on detail by publish order', async () => {
    bySlug.clear();
    const older = new Date('2024-01-01');
    const newer = new Date('2024-06-01');
    bySlug.set(
      'older-article',
      articleRow({
        slug: 'older-article',
        publishStatus: 'published',
        publishedAt: older,
      }),
    );
    bySlug.set(
      'newer-article',
      articleRow({
        slug: 'newer-article',
        publishStatus: 'published',
        publishedAt: newer,
      }),
    );

    const middle = await request(app.getHttpServer())
      .get('/api/v1/public/writing/older-article')
      .expect(200);

    expect(middle.body.data.prevSlug).toBe('newer-article');
    expect(middle.body.data.nextSlug).toBeUndefined();

    const newest = await request(app.getHttpServer())
      .get('/api/v1/public/writing/newer-article')
      .expect(200);

    expect(newest.body.data.prevSlug).toBeUndefined();
    expect(newest.body.data.nextSlug).toBe('older-article');
  });

  it('omits cover when media alt is empty', async () => {
    bySlug.set(
      'no-cover',
      articleRow({
        slug: 'no-cover',
        publishStatus: 'published',
        publishedAt: new Date(),
        coverMediaId: 'media-no-alt',
      }),
    );
    bySlug.set(
      'with-cover',
      articleRow({
        slug: 'with-cover',
        publishStatus: 'published',
        publishedAt: new Date(),
        coverMediaId: 'media-with-alt',
      }),
    );

    const list = await request(app.getHttpServer())
      .get('/api/v1/public/writing')
      .expect(200);

    const noCover = list.body.data.items.find(
      (c: { slug: string }) => c.slug === 'no-cover',
    );
    const withCover = list.body.data.items.find(
      (c: { slug: string }) => c.slug === 'with-cover',
    );
    expect(noCover.coverUrl).toBeUndefined();
    expect(withCover.coverUrl).toBe('https://cdn.example/cover.jpg');
    expect(withCover.coverAlt).toBe('Cover alt');
  });

  it('returns RSS feed for published articles only', async () => {
    bySlug.set(
      'live',
      articleRow({
        slug: 'live',
        title: 'Live post',
        summary: 'Summary',
        publishStatus: 'published',
        publishedAt: new Date('2024-01-15'),
      }),
    );
    bySlug.set('draft', articleRow({ slug: 'draft', publishStatus: 'draft' }));

    const res = await request(app.getHttpServer())
      .get('/api/v1/public/writing/feed.xml')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/rss\+xml/);
    expect(res.text).toContain('<rss version="2.0">');
    expect(res.text).toContain('Live post');
    expect(res.text).not.toContain('draft');
    expect(res.headers.etag).toBeDefined();
  });

  it('does not treat feed.xml as article slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/writing/feed.xml')
      .expect(200);
    expect(writingMock.findPublishedBySlug).not.toHaveBeenCalledWith('feed.xml');
  });
});
