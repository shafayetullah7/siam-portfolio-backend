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
import { AdminTimelineController } from '../src/admin-api/timeline/admin-timeline.controller';
import { AdminTimelineService } from '../src/admin-api/timeline/admin-timeline.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { MediaService } from '../src/domain/media/media.service';
import { TimelineService } from '../src/domain/timeline/timeline.service';
import type {
  CreateTimelineEntryInput,
  TimelineEntryAdmin,
  UpdateTimelineEntryInput,
} from '../src/domain/timeline/timeline.types';
import { timelineEntryRow } from '../src/domain/timeline/timeline.test-helpers';

const ENTRY_ID = '00000000-0000-4000-8000-000000000088';

function toAdminEntry(row: ReturnType<typeof timelineEntryRow>): TimelineEntryAdmin {
  return { ...row, media: [] };
}

describe('Admin timeline CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof timelineEntryRow>>();

  const timelineMock: Partial<TimelineService> = {
    create: vi.fn(async (input: CreateTimelineEntryInput) => {
      const row = timelineEntryRow({
        id: ENTRY_ID,
        kind: input.kind,
        title: input.title,
        slug: input.slug ?? null,
        organization: input.organization ?? null,
        publishStatus: 'draft',
      });
      store.set(ENTRY_ID, row);
      return row;
    }),
    update: vi.fn(async (id: string, input: UpdateTimelineEntryInput) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.organization !== undefined) {
        row.organization = input.organization?.trim() ?? null;
      }
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Timeline entry not found');
      return toAdminEntry(row);
    }),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.kind) {
        rows = rows.filter((r) => r.kind === query.kind);
      }
      if (query.kinds?.length) {
        rows = rows.filter((r) => query.kinds!.includes(r.kind));
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

  const mediaMock: Partial<MediaService> = {
    findById: vi.fn(),
  };

  beforeEach(async () => {
    store.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminTimelineController],
      providers: [
        AdminTimelineService,
        { provide: TimelineService, useValue: timelineMock },
        { provide: MediaService, useValue: mediaMock },
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

  it('create draft award → patch organization → list filter by kind → get by id', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/timeline')
      .send({ kind: 'award', title: 'Prize' })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.publishStatus).toBe('draft');
    expect(createRes.body.data.kind).toBe('award');
    expect(createRes.body.data.mediaLinks).toEqual([]);

    const id = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/timeline/${id}`)
      .send({ organization: 'Issuer Co' })
      .expect(200);

    expect(patchRes.body.data.organization).toBe('Issuer Co');

    const listAward = await request(app.getHttpServer())
      .get('/api/v1/admin/timeline')
      .query({ kind: 'award' })
      .expect(200);

    expect(listAward.body.data.items).toHaveLength(1);
    expect(listAward.body.data.items[0].title).toBe('Prize');

    const listEducation = await request(app.getHttpServer())
      .get('/api/v1/admin/timeline')
      .query({ kind: 'education' })
      .expect(200);

    expect(listEducation.body.data.items).toHaveLength(0);

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/timeline/${id}`)
      .expect(200);

    expect(getRes.body.data.organization).toBe('Issuer Co');
    expect(getRes.body.data.mediaLinks).toEqual([]);
  });

  it('rejects invalid kind', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/timeline')
      .send({ kind: 'not_a_kind', title: 'T' })
      .expect(400);
  });

  it('returns conflict when domain reports duplicate slug', async () => {
    timelineMock.create = vi.fn(async () => {
      throw new ConflictException('Slug already exists');
    });

    await request(app.getHttpServer())
      .post('/api/v1/admin/timeline')
      .send({ kind: 'award', title: 'Prize', slug: 'taken-slug' })
      .expect(409);
  });
});
