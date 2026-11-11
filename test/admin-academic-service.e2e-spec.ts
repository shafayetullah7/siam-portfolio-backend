import {
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminAcademicServiceController } from '../src/admin-api/academic-service/admin-academic-service.controller';
import { AdminAcademicServiceService } from '../src/admin-api/academic-service/admin-academic-service.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { AcademicServiceService } from '../src/domain/talks/academic-service.service';
import type {
  AcademicServiceEntryRow,
  CreateAcademicServiceInput,
} from '../src/domain/talks/talks.types';

const ENTRY_ID = '00000000-0000-4000-8000-000000000066';

describe('Admin academic service CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, AcademicServiceEntryRow>();

  const serviceMock: Partial<AcademicServiceService> = {
    create: vi.fn(async (input: CreateAcademicServiceInput) => {
      const now = new Date();
      const row: AcademicServiceEntryRow = {
        id: ENTRY_ID,
        organization: input.organization,
        roleTitle: input.roleTitle,
        serviceType: input.serviceType ?? 'other',
        startYear: input.startYear ?? null,
        endYear: input.endYear ?? null,
        proofUrl: input.proofUrl ?? null,
        summary: input.summary ?? null,
        sortOrder: 0,
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      store.set(ENTRY_ID, row);
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Academic service entry not found');
      return row;
    }),
    listAdmin: vi.fn(async () =>
      buildPaginatedResponse([...store.values()], {
        page: 1,
        limit: 24,
        total: store.size,
      }),
    ),
    delete: vi.fn(async (id: string) => {
      store.delete(id);
    }),
    update: vi.fn(async (id) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Academic service entry not found');
      return row;
    }),
  };

  beforeEach(async () => {
    store.clear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminAcademicServiceController],
      providers: [
        AdminAcademicServiceService,
        { provide: AcademicServiceService, useValue: serviceMock },
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

  it('creates entry with https proofUrl', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/academic-service')
      .send({
        organization: 'IEEE',
        roleTitle: 'Reviewer',
        proofUrl: 'https://example.com/profile',
      })
      .expect(201);

    expect(res.body.data.publishStatus).toBe('draft');
    expect(res.body.data.proofUrl).toMatch(/^https:\/\//);
  });
});
