import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPublicationsController } from '../src/admin-api/publications/admin-publications.controller';
import { AdminPublicationsService } from '../src/admin-api/publications/admin-publications.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';

const PUB_ID = '00000000-0000-4000-8000-000000000001';

describe('Admin publications preview (e2e)', () => {
  let app: INestApplication<App>;

  const adminPublicationsMock: Partial<AdminPublicationsService> = {
    preview: vi.fn().mockResolvedValue({
      slug: 'draft-paper',
      title: 'Draft preview title',
      authorsShort: 'Author A',
      year: 2024,
      venue: 'NeurIPS',
      publicationType: 'conference',
      peerReviewed: true,
      abstract: 'Preview abstract',
      href: '/publications/draft-paper',
      seoTitle: 'Draft preview title',
      seoDescription: 'Preview abstract',
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPublicationsController],
      providers: [
        { provide: AdminPublicationsService, useValue: adminPublicationsMock },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns public detail shape for preview', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/publications/${PUB_ID}/preview`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Draft preview title');
    expect(res.body.data.abstract).toBe('Preview abstract');
    expect(res.body.data.peerReviewed).toBe(true);
  });
});
