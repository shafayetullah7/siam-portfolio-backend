import {
  BadRequestException,
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPublicationsController } from '../src/admin-api/publications/admin-publications.controller';
import { AdminPublicationsService } from '../src/admin-api/publications/admin-publications.service';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import {
  formatAuthorsShort,
  normalizeAuthorInputs,
} from '../src/domain/publications/publication-authors';
import { publicationPublishChecklist } from '../src/domain/publications/publication-publish-checklist';
import { PublicationsImportService } from '../src/domain/publications/publications-import.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { publicationRow } from '../src/domain/publications/publications.service.spec';
import type {
  CreatePublicationInput,
  ListPublishedPublicationsQuery,
  PublicationAuthorRow,
  PublicationRow,
} from '../src/domain/publications/publications.types';
import { PublicPublicationsController } from '../src/public-api/publications/public-publications.controller';
import { PublicPublicationsService } from '../src/public-api/publications/public-publications.service';

let nextPubId = 1;

function nextPublicationId(): string {
  const n = nextPubId;
  nextPubId += 1;
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
}

function authorRowsFromInput(
  publicationId: string,
  input: CreatePublicationInput,
): PublicationAuthorRow[] {
  const normalized = normalizeAuthorInputs(input.authors);
  return normalized.map((author, index) => ({
    id: `00000000-0000-4000-8001-${String(index + 1).padStart(12, '0')}`,
    publicationId,
    sortOrder: author.sortOrder,
    name: author.name,
    affiliation: author.affiliation,
    orcid: author.orcid,
  }));
}

describe('Publications admin ↔ public lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, PublicationRow>();
  const authorStore = new Map<string, PublicationAuthorRow[]>();
  const domainHelper = new PublicationsService({} as never, {} as never);

  const publicationsMock: Partial<PublicationsService> = {
    create: vi.fn(async (input: CreatePublicationInput) => {
      const id = nextPublicationId();
      const normalized = normalizeAuthorInputs(input.authors);
      const authorsShort = formatAuthorsShort(normalized);
      const row = publicationRow({
        id,
        slug: input.slug,
        title: input.title,
        authorsShort,
        year: input.year,
        venue: input.venue,
        doi: input.doi ?? null,
        publishStatus: 'draft',
      });
      store.set(id, row);
      authorStore.set(id, authorRowsFromInput(id, input));
      return row;
    }),
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = [...store.values()].find((r) => r.slug === slug);
      if (!row) {
        throw new NotFoundException('Publication not found');
      }
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        )
      ) {
        throw new NotFoundException('Publication not found');
      }
      return row;
    }),
    listPublishedPublic: vi.fn(
      async (query: ListPublishedPublicationsQuery = {}) => {
        let rows = [...store.values()].filter((row) =>
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ),
        );
        const page = Math.max(query.page ?? 1, 1);
        const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
        const total = rows.length;
        const offset = (page - 1) * limit;
        const items = rows.slice(offset, offset + limit);
        return buildPaginatedResponse(items, { page, limit, total });
      },
    ),
    toPublicCard: (row) => domainHelper.toPublicCard(row),
    toPublicDetailForPublication: vi.fn(async (row) => {
      const rows = authorStore.get(row.id) ?? [];
      return domainHelper.toPublicDetail(row, rows);
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
        return row;
      },
    ),
    unpublish: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new NotFoundException('Publication not found');
      row.publishStatus = 'draft';
      row.publishedAt = null;
      return row;
    }),
  };

  beforeEach(async () => {
    store.clear();
    authorStore.clear();
    nextPubId = 1;
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPublicationsController, PublicPublicationsController],
      providers: [
        AdminPublicationsService,
        PublicPublicationsService,
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

  it('draft → publish → public list and slug → unpublish hides from public', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/admin/publications')
      .send({
        slug: 'lifecycle-paper',
        title: 'Lifecycle Paper',
        authors: [{ name: 'Author A' }],
        year: 2024,
        venue: 'NeurIPS',
      })
      .expect(201);

    const id = createRes.body.data.id;

    await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.items).toHaveLength(0);
      });

    await request(app.getHttpServer())
      .get('/api/v1/public/publications/lifecycle-paper')
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/publish`)
      .send({ confirmWarnings: true })
      .expect(200);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .expect(200);

    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].slug).toBe('lifecycle-paper');

    await request(app.getHttpServer())
      .get('/api/v1/public/publications/lifecycle-paper')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.title).toBe('Lifecycle Paper');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/admin/publications/${id}/unpublish`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/public/publications/lifecycle-paper')
      .expect(404);

    const afterList = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .expect(200);

    expect(afterList.body.data.items).toHaveLength(0);
  });
});
