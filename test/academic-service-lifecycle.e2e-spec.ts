import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminAcademicServiceController } from '../src/admin-api/academic-service/admin-academic-service.controller';
import { AdminAcademicServiceService } from '../src/admin-api/academic-service/admin-academic-service.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { AcademicServiceService } from '../src/domain/talks/academic-service.service';
import { academicServicePublishChecklist } from '../src/domain/talks/academic-service-publish-checklist';

const ID = '00000000-0000-4000-8000-000000000066';

describe('Academic service lifecycle (e2e)', () => {
  let app: INestApplication<App>;

  const row = {
    id: ID,
    organization: 'IEEE',
    roleTitle: 'Reviewer',
    serviceType: 'reviewing' as const,
    startYear: 2020,
    endYear: null,
    proofUrl: 'https://example.com',
    summary: null,
    sortOrder: 0,
    publishStatus: 'draft' as const,
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const serviceMock: Partial<AcademicServiceService> = {
    getPublishChecklist: vi.fn(async () => academicServicePublishChecklist(row)),
    publish: vi.fn(async () => ({
      ...row,
      publishStatus: 'published' as const,
      publishedAt: new Date(),
    })),
    findByIdAdmin: vi.fn(async () => row),
  };

  beforeEach(async () => {
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

  it('publishes when checklist passes', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/academic-service/${ID}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);
    expect(res.body.data.publishStatus).toBe('published');
  });
});
