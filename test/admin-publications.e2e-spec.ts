import {
  BadRequestException,
  ConflictException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPublicationsController } from '../src/admin-api/publications/admin-publications.controller';
import { AdminPublicationsService } from '../src/admin-api/publications/admin-publications.service';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import {
  formatAuthorsShort,
  normalizeAuthorInputs,
} from '../src/domain/publications/publication-authors';
import { publicationPublishChecklist } from '../src/domain/publications/publication-publish-checklist';
import { PublicationsImportService } from '../src/domain/publications/publications-import.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import type {
  CreatePublicationInput,
  PublicationAuthorRow,
} from '../src/domain/publications/publications.types';
import { publicationRow } from '../src/domain/publications/publications.service.spec';

const PUB_ID = '00000000-0000-4000-8000-000000000099';

function authorRowsFromInput(
  publicationId: string,
  input: CreatePublicationInput,
): PublicationAuthorRow[] {
  const normalized = normalizeAuthorInputs(input.authors);
  return normalized.map((author, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    publicationId,
    sortOrder: author.sortOrder,
    name: author.name,
    affiliation: author.affiliation,
    orcid: author.orcid,
  }));
}

describe('Admin publications CRUD (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof publicationRow>>();
  const authorStore = new Map<string, PublicationAuthorRow[]>();
  const domainHelper = new PublicationsService({} as never, {} as never);

  const publicationsMock: Partial<PublicationsService> = {
    create: vi.fn(async (input: CreatePublicationInput) => {
      const normalized = normalizeAuthorInputs(input.authors);
      const authorsShort = formatAuthorsShort(normalized);
      const row = publicationRow({
        id: PUB_ID,
        slug: input.slug,
        title: input.title,
        authorsShort,
        year: input.year,
        venue: input.venue,
        significance: input.significance ?? null,
        abstract: input.abstract ?? null,
        publicationType: input.publicationType ?? 'other',
        peerReviewed: input.peerReviewed ?? false,
        doi: input.doi ?? null,
        publisherUrl: input.publisherUrl ?? null,
        featured: input.featured ?? false,
        featuredOnHome: input.featuredOnHome ?? false,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        ownerContribution: input.ownerContribution ?? null,
        correctionNotice: input.correctionNotice ?? null,
        hideFromSearch: input.hideFromSearch ?? false,
        publishStatus: 'draft',
      });
      store.set(PUB_ID, row);
      authorStore.set(PUB_ID, authorRowsFromInput(PUB_ID, input));
      return row;
    }),
    update: vi.fn(async (id, input) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      if (input.title !== undefined) row.title = input.title.trim();
      if (input.year !== undefined) row.year = input.year;
      if (input.authors !== undefined) {
        const normalized = normalizeAuthorInputs(input.authors);
        row.authorsShort = formatAuthorsShort(normalized);
        authorStore.set(
          id,
          authorRowsFromInput(id, {
            ...input,
            slug: row.slug,
            title: row.title,
            year: row.year,
            venue: row.venue,
            authors: input.authors,
          }),
        );
      }
      row.updatedAt = new Date();
      return row;
    }),
    listAuthorsForPublication: vi.fn(async (id: string) => {
      return authorStore.get(id) ?? [];
    }),
    mapAuthorsToAdmin: vi.fn((rows) => domainHelper.mapAuthorsToAdmin(rows)),
    toPublicDetailForPublication: vi.fn(async (row) => {
      const rows = authorStore.get(row.id) ?? [];
      return domainHelper.toPublicDetail(row, rows);
    }),
    formatCitationForPublication: vi.fn(async (row) => {
      const rows = authorStore.get(row.id) ?? [];
      return domainHelper.formatCitation(row, rows);
    }),
    findByIdAdmin: vi.fn(async (id) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      return row;
    }),
    duplicateHintsForRows: vi.fn(async (rows) => {
      const hints = new Map<string, boolean>();
      for (const row of rows) hints.set(row.id, false);
      return hints;
    }),
    suggestUniqueSlug: vi.fn(async (title: string) =>
      title.toLowerCase().replace(/\s+/g, '-'),
    ),
    findByDoi: vi.fn(async () => null),
    findByTitleYear: vi.fn(async () => []),
    listAdmin: vi.fn(async (query = {}) => {
      let rows = [...store.values()];
      if (query.q?.trim()) {
        const q = query.q.trim().toLowerCase();
        rows = rows.filter(
          (r) =>
            r.title.toLowerCase().includes(q) ||
            r.slug.toLowerCase().includes(q) ||
            r.authorsShort.toLowerCase().includes(q),
        );
      }
      if (query.publishStatus) {
        rows = rows.filter((r) => r.publishStatus === query.publishStatus);
      }
      if (query.year !== undefined) {
        rows = rows.filter((r) => r.year === query.year);
      }
      if (query.publicationType) {
        rows = rows.filter(
          (r) => r.publicationType === query.publicationType,
        );
      }
      return rows;
    }),
    getPublishChecklist: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      return publicationPublishChecklist(row);
    }),
    publish: vi.fn(
      async (id: string, options: { confirmWarnings?: boolean } = {}) => {
        const row = store.get(id);
        if (!row) throw new NotFoundException('Publication not found');
        const checklist = publicationPublishChecklist(row);
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
      },
    ),
    unpublish: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      row.publishStatus = 'draft';
      row.publishedAt = null;
      row.scheduledAt = null;
      return row;
    }),
    archive: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      row.publishStatus = 'archived';
      row.archivedAt = new Date();
      return row;
    }),
    schedule: vi.fn(async (id: string, scheduledAt: Date) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      row.publishStatus = 'scheduled';
      row.scheduledAt = scheduledAt;
      row.archivedAt = null;
      return row;
    }),
  };

  beforeEach(async () => {
    store.clear();
    authorStore.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPublicationsController],
      providers: [
        AdminPublicationsService,
        { provide: PublicationsService, useValue: publicationsMock },
        {
          provide: PublicationsImportService,
          useValue: new PublicationsImportService(
            publicationsMock as PublicationsService,
          ),
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
      .post('/api/v1/admin/publications')
      .send({
        slug: 'test-paper',
        title: 'Original title',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.slug).toBe('test-paper');
    expect(createRes.body.data.publishStatus).toBe('draft');
    expect(createRes.body.data.publicationType).toBe('other');
    expect(createRes.body.data.peerReviewed).toBe(false);
    expect(createRes.body.data.authors).toEqual([
      { sortOrder: 0, name: 'Author A' },
    ]);

    const id = createRes.body.data.id;

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/publications/${id}`)
      .send({ title: 'Updated title' })
      .expect(200);

    expect(patchRes.body.data.title).toBe('Updated title');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/publications')
      .expect(200);

    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].title).toBe('Updated title');
  });

  it('rejects invalid slug', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'Invalid Slug!',
        title: 'T',
        authors: [{ name: 'A' }],
        year: 2024,
        venue: 'V',
      })
      .expect(400);
  });

  it('publish sets publishedAt then unpublish clears it', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'pub-paper',
        title: 'Publish me',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
      })
      .expect(201);

    const id = createRes.body.data.id;

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(201);

    expect(publishRes.body.data.publishStatus).toBe('published');
    expect(publishRes.body.data.publishedAt).toBeTruthy();

    const unpublishRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/unpublish`)
      .expect(201);

    expect(unpublishRes.body.data.publishStatus).toBe('draft');
    expect(unpublishRes.body.data.publishedAt).toBeNull();
  });

  it('returns publish-check warnings for draft without DOI', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'check-paper',
        title: 'Check me',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
        abstract: 'Abstract text',
        publicationType: 'conference',
        peerReviewed: true,
        doi: '10.5555/check',
      })
      .expect(201);

    const id = createRes.body.data.id;

    const row = store.get(id)!;
    row.doi = null;

    const checkRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/publications/${id}/publish-check`)
      .expect(200);

    expect(
      checkRes.body.data.warnings.some(
        (w: { code: string }) => w.code === 'doi_missing',
      ),
    ).toBe(true);
  });

  it('publish without confirmWarnings returns PUBLISH_WARNINGS', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'warn-paper',
        title: 'Warn me',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
        abstract: 'Abstract text',
        publicationType: 'conference',
        peerReviewed: true,
        doi: '10.5555/warn',
      })
      .expect(201);

    const id = createRes.body.data.id;
    const row = store.get(id)!;
    row.doi = null;

    const publishRes = await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/publish`)
      .send({})
      .expect(400);

    expect(publishRes.body.success).toBe(false);
    expect(publishRes.body.message).toContain('Confirm publish warnings');
  });

  it('publish-check errors when title cleared', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'block-paper',
        title: 'Block me',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
      })
      .expect(201);

    const id = createRes.body.data.id;
    store.get(id)!.title = '  ';

    const checkRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/publications/${id}/publish-check`)
      .expect(200);

    expect(checkRes.body.data.errors.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(400);
  });

  it('returns citation with ordered authors for draft', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'cite-paper',
        title: 'Citation Test Paper',
        authors: [{ name: 'First Author' }, { name: 'Second Author' }],
        year: 2024,
        venue: 'ICML',
        publicationType: 'conference',
        doi: '10.1234/cite',
      })
      .expect(201);

    const id = createRes.body.data.id;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/publications/${id}/citation`)
      .expect(200);

    expect(res.body.data.citeKey).toBe('cite-paper');
    expect(res.body.data.bibtex).toContain('Citation Test Paper');
    expect(res.body.data.bibtex).toContain('First Author and Second Author');
    expect(res.body.data.formatted).toContain('First Author & Second Author');
  });

  it('returns 409 when create conflicts', async () => {
    vi.mocked(publicationsMock.create!).mockRejectedValueOnce(
      new ConflictException('Slug already exists'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'dup',
        title: 'T',
        authors: [{ name: 'A' }],
        year: 2024,
        venue: 'V',
      })
      .expect(409);
  });
});
