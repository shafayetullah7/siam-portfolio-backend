import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminWritingController } from '../src/admin-api/writing/admin-writing.controller';
import { AdminWritingService } from '../src/admin-api/writing/admin-writing.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { AppConfigService } from '../src/config/app-config.service';
import { articlePublishChecklist } from '../src/domain/writing/article-publish-checklist';
import { MediaService } from '../src/domain/media/media.service';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ResearchService } from '../src/domain/research/research.service';
import { SiteService } from '../src/domain/site/site.service';
import { recomputeReadingStats } from '../src/domain/writing/writing-reading-stats';
import { WritingService } from '../src/domain/writing/writing.service';
import { articleRow } from '../src/domain/writing/writing.test-helpers';
import type { ArticleRow } from '../src/domain/writing/writing.types';
import { PublicWritingController } from '../src/public-api/writing/public-writing.controller';
import { PublicWritingService } from '../src/public-api/writing/public-writing.service';

const ARTICLE_ID = '00000000-0000-4000-8000-000000000099';

function longBody(): string {
  return Array.from({ length: 100 }, (_, i) => `word${i}`).join(' ');
}

describe('Writing lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  const byId = new Map<string, ArticleRow>();

  function syncSlug(row: ArticleRow) {
    byId.set(row.id, row);
  }

  function visibleRows(): ArticleRow[] {
    return [...byId.values()].filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
      ),
    );
  }

  const domain = new WritingService({} as never, {} as never);

  const writingMock: Partial<WritingService> = {
    create: vi.fn(async (input) => {
      const body = input.body ?? longBody();
      const stats = recomputeReadingStats(body);
      const row = articleRow({
        id: ARTICLE_ID,
        slug: input.slug ?? 'test-article',
        title: input.title ?? 'Title',
        summary: input.summary ?? 'Summary',
        body,
        wordCount: stats.wordCount,
        readingTimeMinutes: stats.readingTimeMinutes,
        publishStatus: 'draft',
        tags: input.tags ?? ['essay'],
      });
      syncSlug(row);
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      return row;
    }),
    getPublishChecklist: vi.fn(async (id: string) => {
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      return articlePublishChecklist(row, {});
    }),
    publish: vi.fn(async (id: string, options: { confirmWarnings?: boolean } = {}) => {
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      const checklist = articlePublishChecklist(row, {});
      if (checklist.errors.length > 0) {
        throw new BadRequestException({
          message: checklist.errors.map((item) => item.message).join('; '),
          code: 'PUBLISH_BLOCKED',
          checklist,
        });
      }
      if (checklist.warnings.length > 0 && !options.confirmWarnings) {
        throw new BadRequestException({
          message: 'Confirm publish warnings before continuing',
          code: 'PUBLISH_WARNINGS',
          checklist,
        });
      }
      const now = new Date();
      const republish = row.materiallyUpdatedAt != null;
      const updated = articleRow({
        ...row,
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
        ...(republish ? { materiallyUpdatedAt: now } : {}),
      });
      syncSlug(updated);
      return updated;
    }),
    unpublish: vi.fn(async (id: string) => {
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      const materiallyUpdatedAt =
        row.materiallyUpdatedAt ?? row.publishedAt ?? null;
      const updated = articleRow({
        ...row,
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
        ...(materiallyUpdatedAt ? { materiallyUpdatedAt } : {}),
      });
      syncSlug(updated);
      return updated;
    }),
    schedule: vi.fn(async (id: string, scheduledAt: Date) => {
      if (scheduledAt.getTime() <= Date.now()) {
        throw new BadRequestException('scheduledAt must be in the future');
      }
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      const updated = articleRow({
        ...row,
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      });
      syncSlug(updated);
      return updated;
    }),
    archive: vi.fn(async (id: string) => {
      const row = byId.get(id);
      if (!row) throw new NotFoundException('Article not found');
      const updated = articleRow({
        ...row,
        publishStatus: 'archived',
        archivedAt: new Date(),
      });
      syncSlug(updated);
      return updated;
    }),
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = [...byId.values()].find((r) => r.slug === slug);
      if (!row) throw new NotFoundException('Article not found');
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
      const page = Math.max(query.page ?? 1, 1);
      const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
      const offset = (page - 1) * limit;
      const rows = visibleRows();
      const slice = rows.slice(offset, offset + limit);
      return buildPaginatedResponse(slice, {
        page,
        limit,
        total: rows.length,
      });
    }),
    toPublicCard: vi.fn((row: ArticleRow) => domain.toPublicCard(row)),
    toPublicDetail: vi.fn((row: ArticleRow) => domain.toPublicDetail(row)),
    listPublishedSeriesSections: vi.fn(async () => []),
    adjacentPublishedSlugs: vi.fn(async () => ({})),
    adjacentInSeriesSlugs: vi.fn(async () => ({})),
    getSeriesById: vi.fn(async () => null),
    listPublicationIdsForArticle: vi.fn(async () => []),
    listProjectIdsForArticle: vi.fn(async () => []),
    listThemeIdsForArticle: vi.fn(async () => []),
    listRelatedArticleIdsForArticle: vi.fn(async () => []),
    listPublishedCardsByIds: vi.fn(async () => []),
    getArticleRelations: vi.fn(async () => ({
      publicationIds: [],
      projectIds: [],
      themeIds: [],
      relatedArticleIds: [],
    })),
    replaceArticleRelations: vi.fn(async () => ({
      publicationIds: [],
      projectIds: [],
      themeIds: [],
      relatedArticleIds: [],
    })),
  };

  const mediaMock: Partial<MediaService> = {
    findById: vi.fn(async () => {
      throw new NotFoundException('Media not found');
    }),
  };

  const siteMock: Partial<SiteService> = {
    getOrCreateSettings: vi.fn().mockResolvedValue({
      writingHubIntro: null,
      siteName: 'SIAM',
    }),
  };

  beforeEach(async () => {
    byId.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminWritingController, PublicWritingController],
      providers: [
        AdminWritingService,
        PublicWritingService,
        { provide: WritingService, useValue: writingMock },
        { provide: PublicationsService, useValue: {
          listPublishedCardsByIds: vi.fn(async () => []),
        } },
        { provide: ProjectsService, useValue: {
          listPublishedCardsByIds: vi.fn(async () => []),
        } },
        { provide: ResearchService, useValue: {
          listPublishedThemeCardsByIds: vi.fn(async () => []),
        } },
        { provide: MediaService, useValue: mediaMock },
        { provide: SiteService, useValue: siteMock },
        { provide: AppConfigService, useValue: { frontendUrl: 'http://localhost:5001' } },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('publish makes article visible on public list; unpublish hides it', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'lifecycle-test',
        title: 'Lifecycle',
        summary: 'Summary text',
        body: longBody(),
        tags: ['essay'],
      })
      .expect(201);

    const id = createRes.body.data.id as string;

    await request(app.getHttpServer())
      .get('/api/v1/public/writing')
      .expect(200)
      .then((res) => {
        expect(res.body.data.items).toHaveLength(0);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/writing/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(201)
      .then((res) => {
        expect(res.body.data.publishStatus).toBe('published');
      });

    await request(app.getHttpServer())
      .get('/api/v1/public/writing')
      .expect(200)
      .then((res) => {
        const slugs = res.body.data.items.map((c: { slug: string }) => c.slug);
        expect(slugs).toContain('lifecycle-test');
      });

    await request(app.getHttpServer())
      .get('/api/v1/public/writing/lifecycle-test')
      .expect(200);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/writing/${id}/unpublish`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/public/writing')
      .expect(200)
      .then((res) => {
        expect(res.body.data.items).toHaveLength(0);
      });

    await request(app.getHttpServer())
      .get('/api/v1/public/writing/lifecycle-test')
      .expect(404);
  });

  it('includes published article in RSS feed then removes after unpublish', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'feed-lifecycle',
        title: 'Feed Lifecycle Title',
        summary: 'Summary for feed',
        body: longBody(),
        tags: ['essay'],
      })
      .expect(201);

    const id = createRes.body.data.id as string;

    await request(app.getHttpServer())
      .post(`/api/v1/admin/writing/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);

    const feed = await request(app.getHttpServer())
      .get('/api/v1/public/writing/feed.xml')
      .expect(200);

    expect(feed.text).toContain('Feed Lifecycle Title');
    expect(feed.text).toContain('/writing/feed-lifecycle');

    await request(app.getHttpServer())
      .post(`/api/v1/admin/writing/${id}/unpublish`)
      .expect(201);

    const feedAfter = await request(app.getHttpServer())
      .get('/api/v1/public/writing/feed.xml')
      .expect(200);

    expect(feedAfter.text).not.toContain('Feed Lifecycle Title');
  });

  it('blocks publish when body is empty', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'empty-body',
        title: 'Empty',
        summary: 'Summary text',
        body: '',
        tags: ['essay'],
      })
      .expect(201);

    const id = createRes.body.data.id as string;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/writing/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/body/i);
  });
});
