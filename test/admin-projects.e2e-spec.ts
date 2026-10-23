import {
  BadRequestException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { projectPublishChecklist } from '../src/domain/projects/project-publish-checklist';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminProjectsController } from '../src/admin-api/projects/admin-projects.controller';
import { AdminProjectsService } from '../src/admin-api/projects/admin-projects.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { StandardSchemaValidationPipe } from '../src/common/pipes/standard-schema-validation.pipe';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicProjectsService } from '../src/public-api/projects/public-projects.service';
import type {
  CreateProjectInput,
  ProjectMetricRow,
  ProjectResourceRow,
  ProjectSectionRow,
  UpdateProjectInput,
} from '../src/domain/projects/projects.types';
import { projectRow } from '../src/domain/projects/projects.service.spec';

const PROJECT_ID = '00000000-0000-4000-8000-000000000099';

describe('Admin projects CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof projectRow>>();
  const sectionStore = new Map<string, ProjectSectionRow[]>();
  const resourceStore = new Map<string, ProjectResourceRow[]>();
  const metricStore = new Map<string, ProjectMetricRow[]>();
  const domainHelper = new ProjectsService({} as never, {} as never, {} as never);

  function checklistFor(id: string) {
    const row = store.get(id);
    if (!row) throw new NotFoundException('Project not found');
    const sections = sectionStore.get(id) ?? [];
    return projectPublishChecklist(row, sections, [], [], {});
  }

  const projectsMock: Partial<ProjectsService> = {
    create: vi.fn(async (input: CreateProjectInput) => {
      const row = projectRow({
        id: PROJECT_ID,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        tags: input.tags ?? null,
        projectType: input.projectType ?? 'other',
        publishStatus: 'draft',
      });
      store.set(PROJECT_ID, row);
      if (input.sections) {
        sectionStore.set(
          PROJECT_ID,
          input.sections.map((s, index) => ({
            id: `sec-${index}`,
            projectId: PROJECT_ID,
            sortOrder: index,
            kind: s.kind ?? 'custom',
            title: s.title ?? null,
            body: s.body,
          })),
        );
      }
      return row;
    }),
    update: vi.fn(async (id: string, input: UpdateProjectInput) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.summary !== undefined) row.summary = input.summary.trim();
      if (input.sections !== undefined) {
        sectionStore.set(
          id,
          input.sections.map((s, index) => ({
            id: `sec-${index}`,
            projectId: id,
            sortOrder: index,
            kind: s.kind ?? 'problem',
            title: s.title ?? null,
            body: s.body,
          })),
        );
      }
      row.updatedAt = new Date();
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      return row;
    }),
    listAdmin: vi.fn(async () => [...store.values()]),
    loadSectionsForProject: vi.fn(async (id: string) => {
      return sectionStore.get(id) ?? [];
    }),
    loadResourcesForProject: vi.fn(async () => []),
    loadMetricsForProject: vi.fn(async () => []),
    mapSectionsToAdmin: vi.fn((rows) => domainHelper.mapSectionsToAdmin(rows)),
    mapResourcesToAdmin: vi.fn((rows) => domainHelper.mapResourcesToAdmin(rows)),
    mapMetricsToAdmin: vi.fn((rows) => domainHelper.mapMetricsToAdmin(rows)),
    getPublishChecklist: vi.fn(async (id: string) => checklistFor(id)),
    previewForAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      return domainHelper.toPublicDetail(
        row,
        sectionStore.get(id) ?? [],
        [],
        [],
      );
    }),
    publish: vi.fn(async (id: string, options: { confirmWarnings?: boolean } = {}) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      const checklist = checklistFor(id);
      if (checklist.errors.length > 0) {
        throw new BadRequestException({
          message: checklist.errors.map((item) => item.message).join('; '),
          code: 'PUBLISH_BLOCKED',
          checklist,
        });
      }
      if (checklist.warnings.length > 0 && !options.confirmWarnings) {
        throw new BadRequestException({
          message: 'Confirm publish warnings before continuing',
          code: 'PUBLISH_WARNINGS',
          checklist,
        });
      }
      row.publishStatus = 'published';
      row.publishedAt = new Date();
      row.scheduledAt = null;
      row.archivedAt = null;
      return row;
    }),
    unpublish: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      row.publishStatus = 'draft';
      row.publishedAt = null;
      row.scheduledAt = null;
      return row;
    }),
    archive: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      row.publishStatus = 'archived';
      row.archivedAt = new Date();
      return row;
    }),
    listPublicationIdsForProject: vi.fn(async () => []),
    replacePublications: vi.fn(async () => undefined),
    loadSectionMediaIdsBySectionIds: vi.fn(async () => new Map()),
    schedule: vi.fn(async (id: string, scheduledAt: Date) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Project not found');
      row.publishStatus = 'scheduled';
      row.scheduledAt = scheduledAt;
      row.archivedAt = null;
      return row;
    }),
  };

  const publicationsMock = {
    findManyByIds: vi.fn(async (ids: string[]) =>
      ids.map((id, index) => ({
        id,
        slug: `pub-${index}`,
        title: `Paper ${index}`,
        authorsShort: 'Author',
        year: 2024,
        venue: 'Venue',
        publishStatus: 'published',
      })),
    ),
  };

  const publicProjectsMock = {
    enrichPublicDetail: vi.fn(async (_id: string, base: unknown) => base),
  };

  beforeEach(async () => {
    store.clear();
    sectionStore.clear();
    resourceStore.clear();
    metricStore.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminProjectsController],
      providers: [
        AdminProjectsService,
        { provide: ProjectsService, useValue: projectsMock },
        { provide: PublicationsService, useValue: publicationsMock },
        { provide: PublicProjectsService, useValue: publicProjectsMock },
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

  it('create draft with sections → patch summary → list contains row', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'case-study',
        title: 'Case Study',
        summary: 'One-line summary',
        sections: [
          { kind: 'problem', body: 'The problem' },
          { kind: 'limitations', body: 'Limits' },
        ],
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.slug).toBe('case-study');
    expect(createRes.body.data.sections).toHaveLength(2);
    expect(createRes.body.data.sections[0].sortOrder).toBe(0);

    const id = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/projects/${id}`)
      .send({ summary: 'Updated summary' })
      .expect(200);

    expect(patchRes.body.data.summary).toBe('Updated summary');

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/projects/${id}`)
      .expect(200);

    expect(getRes.body.data.sections[1].body).toBe('Limits');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/projects')
      .expect(200);

    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].sections).toEqual([]);
  });

  it('preview returns draft title', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'preview-me',
        title: 'Preview Me',
        summary: 'Summary text',
        sections: [{ kind: 'problem', body: 'P' }],
      })
      .expect(201);
    const id = createRes.body.data.id;
    const previewRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/projects/${id}/preview`)
      .expect(200);
    expect(previewRes.body.data.title).toBe('Preview Me');
  });

  it('publish-check returns warnings without repo', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'check-me',
        title: 'Check Me',
        summary: 'Summary',
        ownerRole: 'Lead',
        sections: [
          { kind: 'problem', body: 'Problem' },
          { kind: 'limitations', body: 'Limits' },
        ],
      })
      .expect(201);
    const id = createRes.body.data.id;
    const checkRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/projects/${id}/publish-check`)
      .expect(200);
    expect(
      checkRes.body.data.warnings.some(
        (w: { code: string }) => w.code === 'no_repo_or_demo',
      ),
    ).toBe(true);
  });

  it('publish blocked without limitations', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'blocked',
        title: 'Blocked',
        summary: 'Summary',
        ownerRole: 'Lead',
        projectType: 'other',
        evaluationMaturity: 'verified',
        sections: [{ kind: 'problem', body: 'Problem' }],
      })
      .expect(201);
    const id = createRes.body.data.id;
    await request(app.getHttpServer())
      .post(`/api/v1/admin/projects/${id}/publish`)
      .send({})
      .expect(400);
  });

  it('publish with confirmWarnings when only warnings', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'publish-me',
        title: 'Publish Me',
        summary: 'Ready summary',
        ownerRole: 'Lead',
        sections: [
          { kind: 'problem', body: 'Problem' },
          { kind: 'limitations', body: 'Limits' },
        ],
      })
      .expect(201);

    const id = createRes.body.data.id;

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/projects/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);

    expect(publishRes.body.data.publishStatus).toBe('published');
    expect(publishRes.body.data.publishedAt).toBeTruthy();

    const unpublishRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/projects/${id}/unpublish`)
      .expect(201);

    expect(unpublishRes.body.data.publishStatus).toBe('draft');
    expect(unpublishRes.body.data.publishedAt).toBeNull();
  });

  it('get and put project publication links', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/projects')
      .send({
        slug: 'with-pubs',
        title: 'With Pubs',
        summary: 'Summary',
      })
      .expect(201);
    const id = createRes.body.data.id;
    const pubId = '00000000-0000-4000-8000-000000000101';

    vi.mocked(projectsMock.replacePublications!).mockImplementation(
      async (_projectId, ids) => {
        vi.mocked(projectsMock.listPublicationIdsForProject!).mockResolvedValue(
          ids,
        );
      },
    );

    const putRes = await request(app.getHttpServer())
      .put(`/api/v1/admin/projects/${id}/publications`)
      .send({ publicationIds: [pubId] })
      .expect(200);

    expect(putRes.body.data).toHaveLength(1);
    expect(putRes.body.data[0].id).toBe(pubId);
    expect(projectsMock.replacePublications).toHaveBeenCalledWith(id, [pubId]);
  });
});
