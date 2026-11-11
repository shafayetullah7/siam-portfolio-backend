import {
  BadRequestException,
  INestApplication,
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
import { CollaborationsService } from '../src/domain/talks/collaborations.service';
import { collaborationPublishChecklist } from '../src/domain/talks/collaboration-publish-checklist';

const ID = '00000000-0000-4000-8000-000000000077';

describe('Collaborations lifecycle (e2e)', () => {
  let app: INestApplication<App>;

  const row = {
    id: ID,
    partnerName: 'MIT',
    summary: 'Joint work',
    institution: null,
    logoMediaId: 'media-1',
    role: null,
    period: null,
    outcomes: null,
    sortOrder: 0,
    publishStatus: 'draft' as const,
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const collaborationsMock: Partial<CollaborationsService> = {
    getPublishChecklist: vi.fn(async () =>
      collaborationPublishChecklist(row, { logoAlt: '', logoMediaMissing: false }),
    ),
    publish: vi.fn(async () => {
      const checklist = collaborationPublishChecklist(row, {
        logoAlt: '',
        logoMediaMissing: false,
      });
      if (checklist.errors.length > 0) {
        throw new BadRequestException({ code: 'PUBLISH_BLOCKED', checklist });
      }
      return row;
    }),
    findByIdAdmin: vi.fn(async () => row),
  };

  beforeEach(async () => {
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

  it('blocks publish when logo lacks alt', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/admin/collaborations/${ID}/publish`)
      .send({})
      .expect(400);
  });
});
