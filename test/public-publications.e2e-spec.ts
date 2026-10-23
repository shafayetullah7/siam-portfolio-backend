import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { publicationRow } from '../src/domain/publications/publications.service.spec';
import type {
  ListPublishedPublicationsQuery,
  PublicationAuthorRow,
  PublicationRow,
  PublicationSupplementRow,
} from '../src/domain/publications/publications.types';
import { PublicPublicationsController } from '../src/public-api/publications/public-publications.controller';
import { PublicPublicationsService } from '../src/public-api/publications/public-publications.service';

describe('Public publications (e2e)', () => {
  let app: INestApplication<App>;
  const bySlug = new Map<string, PublicationRow>();
  const authorByPublicationId = new Map<string, PublicationAuthorRow[]>();
  const supplementsByPublicationId = new Map<
    string,
    PublicationSupplementRow[]
  >();

  const domain = new PublicationsService({} as never, {} as never);

  const publicationsMock: Partial<PublicationsService> = {
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = bySlug.get(slug);
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
        let rows = [...bySlug.values()].filter((row) =>
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ),
        );
        const q = query.q?.trim();
        if (q) {
          const needle = q.toLowerCase();
          rows = rows.filter(
            (row) =>
              row.title.toLowerCase().includes(needle) ||
              row.slug.toLowerCase().includes(needle) ||
              row.authorsShort.toLowerCase().includes(needle) ||
              (row.doi?.toLowerCase().includes(needle) ?? false),
          );
          rows = rows.filter((row) => !row.hideFromSearch);
        }
        if (query.year !== undefined) {
          rows = rows.filter((row) => row.year === Number(query.year));
        }
        if (query.publicationType) {
          rows = rows.filter(
            (row) => row.publicationType === query.publicationType,
          );
        }
        const page = Math.max(query.page ?? 1, 1);
        const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
        const total = rows.length;
        const offset = (page - 1) * limit;
        const items = rows.slice(offset, offset + limit);
        return buildPaginatedResponse(items, { page, limit, total });
      },
    ),
    toPublicCard: (row) => domain.toPublicCard(row),
    toPublicDetail: (row, authorRows = []) =>
      domain.toPublicDetail(row, authorRows),
    toPublicDetailForPublication: vi.fn(async (row, options?: { includePdf?: boolean }) => {
      const authorRows = authorByPublicationId.get(row.id) ?? [];
      const supplementRows = supplementsByPublicationId.get(row.id) ?? [];
      const pdfHref =
        options?.includePdf && row.pdfMediaId
          ? 'https://cdn.example/paper.pdf'
          : undefined;
      return domain.toPublicDetail(row, authorRows, supplementRows, pdfHref);
    }),
    formatCitationForPublication: vi.fn(async (row) => {
      const authorRows = authorByPublicationId.get(row.id) ?? [];
      return domain.formatCitation(row, authorRows);
    }),
  };

  beforeEach(async () => {
    bySlug.clear();
    authorByPublicationId.clear();
    supplementsByPublicationId.clear();

    const draftRow = publicationRow({
      slug: 'draft-paper',
      title: 'Secret Draft Title',
      publishStatus: 'draft',
      pdfMediaId: '00000000-0000-4000-8000-000000000099',
    });
    bySlug.set('draft-paper', draftRow);

    const liveRow = publicationRow({
      slug: 'live-paper',
      title: 'Published Work',
      publishStatus: 'published',
      publishedAt: new Date(),
      abstract: 'An abstract.',
      doi: '10.1234/live',
      year: 2024,
      publicationType: 'journal',
      featured: true,
    });
    bySlug.set('live-paper', liveRow);
    supplementsByPublicationId.set(liveRow.id, [
      {
        id: '00000000-0000-4000-8000-000000000010',
        publicationId: liveRow.id,
        sortOrder: 0,
        label: 'Code',
        url: 'https://github.com/org/repo',
        kind: 'code',
      },
    ]);
    liveRow.pdfMediaId = '00000000-0000-4000-8000-000000000011';
    authorByPublicationId.set(liveRow.id, [
      {
        id: '00000000-0000-4000-8000-000000000001',
        publicationId: liveRow.id,
        sortOrder: 0,
        name: 'First Author',
        affiliation: 'Lab A',
        orcid: null,
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        publicationId: liveRow.id,
        sortOrder: 1,
        name: 'Second Author',
        affiliation: null,
        orcid: '0000-0002-1825-0097',
      },
    ]);
    bySlug.set(
      'scheduled-future',
      publicationRow({
        slug: 'scheduled-future',
        title: 'Future',
        publishStatus: 'scheduled',
        scheduledAt: new Date(Date.now() + 60_000),
      }),
    );
    bySlug.set(
      'scheduled-due',
      publicationRow({
        slug: 'scheduled-due',
        title: 'Due Now',
        publishStatus: 'scheduled',
        scheduledAt: new Date(Date.now() - 1000),
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicPublicationsController],
      providers: [
        PublicPublicationsService,
        { provide: PublicationsService, useValue: publicationsMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 404 for draft slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/publications/draft-paper')
      .expect(404);
  });

  it('returns 404 for scheduled publication before due time', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/publications/scheduled-future')
      .expect(404);
  });

  it('returns detail for published slug without admin fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/publications/live-paper')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('live-paper');
    expect(res.body.data.abstract).toBe('An abstract.');
    expect(res.body.data.doi).toBe('10.1234/live');
    expect(res.body.data.publicationType).toBe('journal');
    expect(res.body.data.href).toBe('/publications/live-paper');
    expect(res.body.data).not.toHaveProperty('id');
    expect(res.body.data).not.toHaveProperty('publishStatus');
    expect(res.body.data.authors).toEqual([
      { name: 'First Author', affiliation: 'Lab A' },
      { name: 'Second Author', orcid: '0000-0002-1825-0097' },
    ]);
    expect(res.body.data.supplements).toEqual([
      {
        label: 'Code',
        url: 'https://github.com/org/repo',
        kind: 'code',
      },
    ]);
    expect(res.body.data.pdfHref).toBe('https://cdn.example/paper.pdf');
    expect(res.body.data.availability).toBe('open_access');
  });

  it('lists only publicly visible publications', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .expect(200);

    expect(res.body.data.items.map((i: { slug: string }) => i.slug)).toEqual([
      'live-paper',
      'scheduled-due',
    ]);
    expect(res.body.data.meta.total).toBe(2);
    expect(res.body.data.items[0].featured).toBe(true);
    expect(res.body.data.items[0].availability).toBe('open_access');
  });

  it('returns scheduled publication when due', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/publications/scheduled-due')
      .expect(200);
  });

  it('filters list by q and excludes non-visible matches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .query({ q: 'Secret' })
      .expect(200);

    expect(res.body.data.items).toHaveLength(0);

    const publishedRes = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .query({ q: 'Published' })
      .expect(200);

    expect(publishedRes.body.data.items).toHaveLength(1);
    expect(publishedRes.body.data.items[0].slug).toBe('live-paper');
    expect(publishedRes.body.data.meta.total).toBe(1);
  });

  it('returns bibtex for published slug with author order', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/publications/live-paper/bibtex')
      .expect(200);

    expect(res.body.data.citeKey).toBe('live-paper');
    expect(res.body.data.bibtex).toContain('First Author and Second Author');
    expect(res.body.data.formatted).toContain('Published Work');
  });

  it('returns 404 for bibtex on draft slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/publications/draft-paper/bibtex')
      .expect(404);
  });

  it('filters list by year and type', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .query({ year: 2024, type: 'journal' })
      .expect(200);

    expect(res.body.data.meta.total).toBe(1);
    expect(res.body.data.items[0].slug).toBe('live-paper');

    const miss = await request(app.getHttpServer())
      .get('/api/v1/public/publications')
      .query({ year: 1999 })
      .expect(200);

    expect(miss.body.data.meta.total).toBe(0);
  });
});
