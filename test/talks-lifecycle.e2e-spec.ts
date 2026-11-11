import {
  BadRequestException,
  INestApplication,
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
import { TalksService } from '../src/domain/talks/talks.service';
import { talkPublishChecklist } from '../src/domain/talks/talk-publish-checklist';
import { talkRow } from '../src/domain/talks/talks.test-helpers';
import type { TalkRow } from '../src/domain/talks/talks.types';

const TALK_ID = '00000000-0000-4000-8000-000000000088';

describe('Talks lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let row: TalkRow;

  const talksMock: Partial<TalksService> = {
    findByIdAdmin: vi.fn(async () => row),
    listResourcesAdmin: vi.fn(async () => []),
    getRelationsAdmin: vi.fn(async () => ({
      publicationIds: [],
      projectIds: [],
      themeIds: [],
    })),
    getPublishChecklist: vi.fn(async () => {
      return talkPublishChecklist(row, {
        resourceCount: 0,
        slugTaken: false,
      });
    }),
    publish: vi.fn(async (_id, options) => {
      const checklist = talkPublishChecklist(row, {
        resourceCount: 0,
        slugTaken: false,
      });
      if (checklist.errors.length > 0) {
        throw new BadRequestException({
          code: 'PUBLISH_BLOCKED',
          checklist,
        });
      }
      if (checklist.warnings.length > 0 && !options?.confirmWarnings) {
        throw new BadRequestException({
          code: 'PUBLISH_WARNINGS',
          checklist,
        });
      }
      row = { ...row, publishStatus: 'published', publishedAt: new Date() };
      return row;
    }),
  };

  beforeEach(async () => {
    row = talkRow({ id: TALK_ID, timezone: '' });
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

  it('publish-check reports timezone error', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/talks/${TALK_ID}/publish-check`)
      .expect(200);
    expect(res.body.data.errors.some((e: { code: string }) => e.code === 'timezone_required')).toBe(
      true,
    );
  });

  it('publish with warnings requires confirm', async () => {
    row = talkRow({ id: TALK_ID, timezone: 'UTC' });
    await request(app.getHttpServer())
      .post(`/api/v1/admin/talks/${TALK_ID}/publish`)
      .send({})
      .expect(400);

    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/talks/${TALK_ID}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);
    expect(res.body.data.publishStatus).toBe('published');
  });
});
