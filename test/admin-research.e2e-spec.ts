import {
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminResearchController } from '../src/admin-api/research/admin-research.controller';
import { AdminResearchService } from '../src/admin-api/research/admin-research.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { researchPublishChecklist } from '../src/domain/research/research-publish-checklist';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ResearchService } from '../src/domain/research/research.service';
import type { ResearchThemeRow } from '../src/domain/research/research.types';
import { PublicResearchService } from '../src/public-api/research/public-research.service';

function baseRow(
  overrides: Partial<ResearchThemeRow> & { id: string; slug: string; title: string },
): ResearchThemeRow {
  const now = new Date();
  return {
    id: overrides.id,
    slug: overrides.slug,
    title: overrides.title,
    summary: overrides.summary ?? 'Summary',
    themeStatus: overrides.themeStatus ?? 'ongoing',
    problem: overrides.problem ?? '',
    significance: overrides.significance ?? null,
    objectives: overrides.objectives ?? null,
    approach: overrides.approach ?? null,
    findings: overrides.findings ?? null,
    limitations: overrides.limitations ?? null,
    futureWork: overrides.futureWork ?? null,
    tags: overrides.tags ?? null,
    linkLabel: overrides.linkLabel ?? null,
    coverMediaId: overrides.coverMediaId ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    featuredOnHome: overrides.featuredOnHome ?? false,
    publishStatus: overrides.publishStatus ?? 'draft',
    publishedAt: overrides.publishedAt ?? null,
    scheduledAt: overrides.scheduledAt ?? null,
    archivedAt: overrides.archivedAt ?? null,
    seoTitle: overrides.seoTitle ?? null,
    seoDescription: overrides.seoDescription ?? null,
    collaborators: overrides.collaborators ?? null,
    acknowledgments: overrides.acknowledgments ?? null,
    funding: overrides.funding ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

const THEME_ID = '00000000-0000-4000-8000-000000000001';

describe('Admin research CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ResearchThemeRow>();

  const researchMock: Partial<ResearchService> = {
    create: vi.fn(async (input) => {
      const id = THEME_ID;
      const row = baseRow({
        id,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        problem: input.problem ?? '',
        objectives: input.objectives ?? null,
      });
      store.set(id, row);
      return row;
    }),
    update: vi.fn(async (id, input) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Research theme not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.summary !== undefined) row.summary = input.summary.trim();
      if (input.problem !== undefined) row.problem = input.problem;
      if (input.objectives !== undefined) row.objectives = input.objectives;
      if (input.findings !== undefined) row.findings = input.findings;
      if (input.sortOrder !== undefined) row.sortOrder = input.sortOrder;
      if (input.featuredOnHome !== undefined) {
        row.featuredOnHome = input.featuredOnHome;
      }
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Research theme not found');
      return row;
    }),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.q?.trim()) {
        const q = query.q.trim().toLowerCase();
        rows = rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.slug.toLowerCase().includes(q),
        );
      }
      if (query.publishStatus) {
        rows = rows.filter((r) => r.publishStatus === query.publishStatus);
      }
      if (query.themeStatus) {
        rows = rows.filter((r) => r.themeStatus === query.themeStatus);
      }
      if (query.featured === true) {
        rows = rows.filter((r) => r.featuredOnHome);
      } else if (query.featured === false) {
        rows = rows.filter((r) => !r.featuredOnHome);
      }
      return rows;
    }),
    listResources: vi.fn(async () => []),
    listPublicationIdsForTheme: vi.fn(async () => []),
    replacePublications: vi.fn(async () => undefined),
    listProjectIdsForTheme: vi.fn(async () => []),
    replaceProjects: vi.fn(async () => undefined),
    getPublishChecklist: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Research theme not found');
      return researchPublishChecklist(row, { coverAlt: null });
    }),
  };

  beforeEach(async () => {
    store.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminResearchController],
      providers: [
        AdminResearchService,
        { provide: ResearchService, useValue: researchMock },
        {
          provide: PublicResearchService,
          useValue: { previewById: vi.fn() },
        },
        {
          provide: PublicationsService,
          useValue: { findManyByIds: vi.fn(async () => []) },
        },
        {
          provide: ProjectsService,
          useValue: { findManyByIds: vi.fn(async () => []) },
        },
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

  it('create draft → patch title → list contains row', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'ml-fairness',
        title: 'Original title',
        summary: 'Card summary',
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.slug).toBe('ml-fairness');
    expect(createRes.body.data.publishStatus).toBe('draft');

    const id = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/research/${id}`)
      .send({ title: 'Updated title' })
      .expect(200);

    expect(patchRes.body.data.title).toBe('Updated title');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/research')
      .expect(200);

    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].title).toBe('Updated title');
  });

  it('rejects invalid slug on create', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'Bad Slug',
        title: 'T',
        summary: 'S',
      })
      .expect(400);
  });

  it('rejects resource URL that is not HTTPS on patch', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'with-resources',
        title: 'T',
        summary: 'S',
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/research/${createRes.body.data.id}`)
      .send({
        resources: [
          {
            label: 'Bad',
            url: 'http://example.com/x',
            resourceType: 'code',
          },
        ],
      })
      .expect(400);
  });

  it('returns publish-check errors and warnings', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'checklist-theme',
        title: 'T',
        summary: 'S',
        problem: 'Problem',
        objectives: 'Goals',
      })
      .expect(201);

    const id = createRes.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/research/${id}`)
      .send({ findings: 'Early results' })
      .expect(200);

    const checkRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/research/${id}/publish-check`)
      .expect(200);

    expect(checkRes.body.data.warnings.some(
      (w: { code: string }) => w.code === 'ongoing_has_findings',
    )).toBe(true);
  });

  it('GET and PUT theme publications', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'pub-links',
        title: 'T',
        summary: 'S',
      })
      .expect(201);

    const id = createRes.body.data.id;

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/research/${id}/publications`)
      .expect(200);

    expect(getRes.body.data).toEqual([]);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/research/${id}/publications`)
      .send({ publicationIds: [] })
      .expect(200);
  });

  it('GET and PUT theme projects', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/research')
      .send({
        slug: 'project-links',
        title: 'T',
        summary: 'S',
      })
      .expect(201);

    const id = createRes.body.data.id;

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/research/${id}/projects`)
      .expect(200);

    expect(getRes.body.data).toEqual([]);

    await request(app.getHttpServer())
      .put(`/api/v1/admin/research/${id}/projects`)
      .send({ projectIds: [] })
      .expect(200);
  });
});
