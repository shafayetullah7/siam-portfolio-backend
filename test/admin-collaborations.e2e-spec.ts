import {
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminCollaborationsController } from '../src/admin-api/collaborations/admin-collaborations.controller';
import { AdminCollaborationsService } from '../src/admin-api/collaborations/admin-collaborations.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { CollaborationsService } from '../src/domain/talks/collaborations.service';
import type {
  CollaborationRow,
  CreateCollaborationInput,
  UpdateCollaborationInput,
} from '../src/domain/talks/talks.types';

const COLLAB_ID = '00000000-0000-4000-8000-000000000077';

function collabRow(overrides: Partial<CollaborationRow> = {}): CollaborationRow {
  const now = new Date();
  return {
    id: COLLAB_ID,
    partnerName: 'Partner',
    summary: 'Summary',
    institution: null,
    logoMediaId: null,
    role: null,
    period: null,
    outcomes: null,
    sortOrder: 0,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('Admin collaborations CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, CollaborationRow>();

  const collaborationsMock: Partial<CollaborationsService> = {
    create: vi.fn(async (input: CreateCollaborationInput) => {
      const row = collabRow({
        partnerName: input.partnerName,
        summary: input.summary,
        publishStatus: 'draft',
      });
      store.set(COLLAB_ID, row);
      return row;
    }),
    update: vi.fn(async (id: string, input: UpdateCollaborationInput) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Collaboration not found');
      if (input.partnerName !== undefined) {
        row.partnerName = input.partnerName.trim();
      }
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Collaboration not found');
      return row;
    }),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.publishStatus) {
        rows = rows.filter((r) => r.publishStatus === query.publishStatus);
      }
      return buildPaginatedResponse(rows, {
        page: 1,
        limit: 24,
        total: rows.length,
      });
    }),
    delete: vi.fn(async (id: string) => {
      if (!store.has(id)) throw new NotFoundException('Collaboration not found');
      store.delete(id);
    }),
  };

  beforeEach(async () => {
    store.clear();
    vi.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminCollaborationsController],
      providers: [
        AdminCollaborationsService,
        { provide: CollaborationsService, useValue: collaborationsMock },
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

  it('create draft → patch → list → delete', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/collaborations')
      .send({ partnerName: 'MIT', summary: 'Joint lab work' })
      .expect(201);

    expect(createRes.body.data.publishStatus).toBe('draft');
    const id = createRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/collaborations/${id}`)
      .send({ partnerName: 'MIT CSAIL' })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/collaborations')
      .query({ publishStatus: 'draft' })
      .expect(200);

    expect(listRes.body.data.items).toHaveLength(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/collaborations/${id}`)
      .expect(200);
  });
});
