import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SitePagesService } from '../src/domain/site-pages/site-pages.service';

describe('Site pages lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, Record<string, unknown>>();

  const sitePagesMock: Partial<SitePagesService> = {
    create: vi.fn(async (input) => {
      const id = 'page-1';
      const row = {
        id,
        slug: input.slug,
        title: input.title,
        body: input.body ?? '',
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
        archivedAt: null,
        seoTitle: null,
        seoDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      store.set(id, row);
      return row;
    }),
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = [...store.values()].find((r) => r.slug === slug);
      if (!row || row.publishStatus !== 'published') {
        throw new NotFoundException('Page not found');
      }
      return row;
    }),
    publish: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new Error('missing');
      row.publishStatus = 'published';
      row.publishedAt = new Date();
      return row;
    }),
    unpublish: vi.fn(async (id: string) => {
      const row = store.get(id);
      row!.publishStatus = 'draft';
      return row;
    }),
  };

  beforeEach(async () => {
    store.clear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SitePagesService)
      .useValue(sitePagesMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('public GET returns 404 for unpublished slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/pages/draft-page')
      .expect(404);
  });
});
