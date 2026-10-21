import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminResearchController } from '../src/admin-api/research/admin-research.controller';
import { AdminResearchService } from '../src/admin-api/research/admin-research.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';

const THEME_ID = '00000000-0000-4000-8000-000000000001';

describe('Admin research preview (e2e)', () => {
  let app: INestApplication<App>;

  const adminResearchMock: Partial<AdminResearchService> = {
    preview: vi.fn().mockResolvedValue({
      slug: 'draft-theme',
      title: 'Draft preview',
      summary: 'Summary',
      themeStatus: 'ongoing',
      tags: null,
      problem: 'Problem',
      seo: { title: 'Draft preview', description: 'Summary' },
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminResearchController],
      providers: [
        { provide: AdminResearchService, useValue: adminResearchMock },
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
      .get(`/api/v1/admin/research/${THEME_ID}/preview`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Draft preview');
    expect(res.body.data.seo.title).toBe('Draft preview');
  });
});
