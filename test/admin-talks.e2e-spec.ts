import {
  BadRequestException,
  ConflictException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminTalksController } from '../src/admin-api/talks/admin-talks.controller';
import { AdminTalksService } from '../src/admin-api/talks/admin-talks.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { TalksService } from '../src/domain/talks/talks.service';
import { talkRow } from '../src/domain/talks/talks.test-helpers';
import type {
  CreateTalkInput,
  TalkResourceRow,
  TalkRow,
  UpdateTalkInput,
} from '../src/domain/talks/talks.types';

const TALK_ID = '00000000-0000-4000-8000-000000000088';

describe('Admin talks CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, TalkRow>();
  const resources = new Map<string, TalkResourceRow[]>();
  const relations = new Map<
    string,
    { publicationIds: string[]; projectIds: string[]; themeIds: string[] }
  >();

  const talksMock: Partial<TalksService> = {
    create: vi.fn(async (input: CreateTalkInput) => {
      const row = talkRow({
        id: TALK_ID,
        slug: input.slug,
        title: input.title,
        eventName: input.eventName,
        timezone: input.timezone,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        publishStatus: 'draft',
      });
      store.set(TALK_ID, row);
      resources.set(TALK_ID, []);
      relations.set(TALK_ID, {
        publicationIds: [],
        projectIds: [],
        themeIds: [],
      });
      return row;
    }),
    update: vi.fn(async (id: string, input: UpdateTalkInput) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Talk not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.timezone !== undefined) row.timezone = input.timezone.trim();
      if (input.startsAt !== undefined) row.startsAt = input.startsAt;
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Talk not found');
      return row;
    }),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.publishStatus) {
        rows = rows.filter((r) => r.publishStatus === query.publishStatus);
      }
      const page = Math.max(query.page ?? 1, 1);
      const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
      const offset = (page - 1) * limit;
      return buildPaginatedResponse(rows.slice(offset, offset + limit), {
        page,
        limit,
        total: rows.length,
      });
    }),
    listResourcesAdmin: vi.fn(async (id: string) => resources.get(id) ?? []),
    getRelationsAdmin: vi.fn(
      async (id: string) =>
        relations.get(id) ?? {
          publicationIds: [],
          projectIds: [],
          themeIds: [],
        },
    ),
    replaceTalkResources: vi.fn(async (id: string, items) => {
      const mapped: TalkResourceRow[] = items.map((item, i) => ({
        id: `res-${i}`,
        talkId: id,
        label: item.label,
        url: item.url,
        resourceType: item.resourceType ?? 'other',
        sortOrder: i,
      }));
      resources.set(id, mapped);
      return mapped;
    }),
    replaceTalkRelations: vi.fn(async (id: string, body) => {
      const themeIds = body.themeIds ?? [];
      if (themeIds.length > 20) {
        throw new BadRequestException('At most 20 themes allowed');
      }
      const next = {
        publicationIds: body.publicationIds ?? [],
        projectIds: body.projectIds ?? [],
        themeIds,
      };
      relations.set(id, next);
      return next;
    }),
    delete: vi.fn(async (id: string) => {
      if (!store.has(id)) throw new NotFoundException('Talk not found');
      store.delete(id);
      resources.delete(id);
      relations.delete(id);
    }),
  };

  beforeEach(async () => {
    store.clear();
    resources.clear();
    relations.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminTalksController],
      providers: [
        AdminTalksService,
        { provide: TalksService, useValue: talksMock },
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

  it('create draft → patch schedule → list filtered → put resources → delete', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/talks')
      .send({
        slug: 'test-talk',
        title: 'Test Talk',
        eventName: 'Conf 2026',
        timezone: 'Europe/London',
        startsAt: '2026-07-01T10:00:00.000Z',
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.slug).toBe('test-talk');
    expect(createRes.body.data.publishStatus).toBe('draft');

    const id = createRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/talks/${id}`)
      .send({
        timezone: 'America/New_York',
        startsAt: '2026-08-01T14:00:00.000Z',
      })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/talks')
      .query({ publishStatus: 'draft' })
      .expect(200);

    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].slug).toBe('test-talk');

    const resourcesRes = await request(app.getHttpServer())
      .put(`/api/v1/admin/talks/${id}/resources`)
      .send({
        resources: [
          {
            label: 'Slides',
            url: 'https://example.com/slides.pdf',
            resourceType: 'slides',
          },
        ],
      })
      .expect(200);

    expect(resourcesRes.body.data.resources).toHaveLength(1);
    expect(resourcesRes.body.data.resources[0].url).toMatch(/^https:\/\//);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/talks/${id}/relations`)
      .send({
        themeIds: Array.from({ length: 21 }, (_, i) =>
          `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
        ),
      })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/talks/${id}`)
      .expect(200);

    await request(app.getHttpServer()).get(`/api/v1/admin/talks/${id}`).expect(404);
  });
});
