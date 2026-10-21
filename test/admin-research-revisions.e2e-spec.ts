import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminResearchController } from '../src/admin-api/research/admin-research.controller';
import { AdminResearchService } from '../src/admin-api/research/admin-research.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';

const THEME_ID = '00000000-0000-4000-8000-000000000001';
const REV_ID = '00000000-0000-4000-8000-000000000002';

describe('Admin research revisions (e2e)', () => {
  let app: INestApplication<App>;

  const adminResearchMock: Partial<AdminResearchService> = {
    listRevisions: vi.fn().mockResolvedValue([
      {
        id: REV_ID,
        entityType: 'research_theme',
        entityId: THEME_ID,
        snapshot: { title: 'Snapshot title', publishStatus: 'draft' },
        createdAt: '2026-01-01T12:00:00.000Z',
      },
    ]),
    restore: vi.fn().mockResolvedValue({
      id: THEME_ID,
      slug: 'theme',
      title: 'Restored title',
      summary: 'Summary',
      themeStatus: 'ongoing',
      problem: '',
      publishStatus: 'draft',
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
      sortOrder: 0,
      featuredOnHome: false,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-02T12:00:00.000Z',
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

  it('lists revisions', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/research/${THEME_ID}/revisions`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].snapshot.title).toBe('Snapshot title');
  });

  it('restores revision', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/research/${THEME_ID}/revisions/${REV_ID}/restore`)
      .expect(201);

    expect(res.body.data.title).toBe('Restored title');
  });
});
