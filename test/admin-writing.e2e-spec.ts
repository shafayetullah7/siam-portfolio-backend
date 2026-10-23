import {
  ConflictException,
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
import { recomputeReadingStats } from '../src/domain/writing/writing-reading-stats';
import { WritingService } from '../src/domain/writing/writing.service';
import type {
  CreateArticleInput,
  UpdateArticleInput,
} from '../src/domain/writing/writing.types';
import { articleRow } from '../src/domain/writing/writing.test-helpers';

const ARTICLE_ID = '00000000-0000-4000-8000-000000000099';

describe('Admin writing CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof articleRow>>();

  const writingMock: Partial<WritingService> = {
    create: vi.fn(async (input: CreateArticleInput) => {
      const body = input.body ?? '';
      const stats = recomputeReadingStats(body);
      const row = articleRow({
        id: ARTICLE_ID,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        body,
        wordCount: stats.wordCount,
        readingTimeMinutes: stats.readingTimeMinutes,
        publishStatus: 'draft',
      });
      store.set(ARTICLE_ID, row);
      return row;
    }),
    update: vi.fn(async (id: string, input: UpdateArticleInput) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Article not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.body !== undefined) {
        row.body = input.body;
        const stats = recomputeReadingStats(input.body);
        row.wordCount = stats.wordCount;
        row.readingTimeMinutes = stats.readingTimeMinutes;
      }
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Article not found');
      return row;
    }),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.q?.trim()) {
        const q = query.q.trim().toLowerCase();
        rows = rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.slug.toLowerCase().includes(q) ||
            r.summary.toLowerCase().includes(q),
        );
      }
      if (query.publishStatus) {
        rows = rows.filter((r) => r.publishStatus === query.publishStatus);
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
  };

  beforeEach(async () => {
    store.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminWritingController],
      providers: [
        AdminWritingService,
        { provide: WritingService, useValue: writingMock },
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

  it('create draft with body → patch title → list contains row → get by id', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'test-article',
        title: 'Original title',
        summary: 'Summary text',
        body: 'one two three four five six seven eight',
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.slug).toBe('test-article');
    expect(createRes.body.data.publishStatus).toBe('draft');
    expect(createRes.body.data.wordCount).toBeGreaterThan(0);
    expect(createRes.body.data.readingTimeMinutes).toBeGreaterThanOrEqual(1);

    const id = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/writing/${id}`)
      .send({ title: 'Updated title' })
      .expect(200);

    expect(patchRes.body.data.title).toBe('Updated title');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/writing')
      .expect(200);

    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].title).toBe('Updated title');
    expect(listRes.body.data.meta.total).toBe(1);

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/writing/${id}`)
      .expect(200);

    expect(getRes.body.data.title).toBe('Updated title');
    expect(getRes.body.data.body).toContain('one two three');
  });

  it('rejects invalid slug', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'Invalid Slug!',
        title: 'T',
        summary: 'S',
      })
      .expect(400);
  });

  it('surfaces duplicate slug as conflict', async () => {
    writingMock.create = vi.fn(async () => {
      throw new ConflictException('Slug already exists');
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/writing')
      .send({
        slug: 'dup',
        title: 'T',
        summary: 'S',
      })
      .expect(409);

    expect(res.body.success).toBe(false);
  });
});
