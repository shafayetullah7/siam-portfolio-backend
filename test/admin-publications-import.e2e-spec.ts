import {
  INestApplication,
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
import { PublicationsImportService } from '../src/domain/publications/publications-import.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { publicationRow } from '../src/domain/publications/publications.service.spec';

const PUB_ID = '00000000-0000-4000-8000-000000000099';
const OTHER_ID = '00000000-0000-4000-8000-000000000088';

describe('Admin publications import (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, ReturnType<typeof publicationRow>>();

  const publicationsMock: Partial<PublicationsService> = {
    suggestUniqueSlug: vi.fn(async (title: string) =>
      title.toLowerCase().replace(/\s+/g, '-'),
    ),
    findByDoi: vi.fn(async (doi: string) => {
      for (const row of store.values()) {
        if (row.doi?.toLowerCase() === doi.toLowerCase()) return row;
      }
      return null;
    }),
    findByTitleYear: vi.fn(async (title: string, year: number) =>
      [...store.values()].filter(
        (row) =>
          row.title.trim().toLowerCase() === title.trim().toLowerCase() &&
          row.year === year,
      ),
    ),
    create: vi.fn(async (input) => {
      const row = publicationRow({
        id: PUB_ID,
        slug: input.slug,
        title: input.title,
        year: input.year,
        venue: input.venue,
        doi: input.doi ?? null,
        publishStatus: 'draft',
      });
      store.set(PUB_ID, row);
      return row;
    }),
    findByIdAdmin: vi.fn(async (id: string) => {
      const row = store.get(id);
      if (!row) throw new Error('not found');
      return row;
    }),
    listAuthorsForPublication: vi.fn(async () => []),
    update: vi.fn(async (id, patch) => {
      const row = store.get(id);
      if (!row) throw new Error('not found');
      if (patch.title !== undefined) row.title = patch.title;
      if (patch.abstract !== undefined) row.abstract = patch.abstract ?? null;
      return row;
    }),
    duplicateHintsForRows: vi.fn(async () => new Map()),
  };

  const importService = new PublicationsImportService(
    publicationsMock as PublicationsService,
  );

  beforeEach(async () => {
    store.clear();
    vi.mocked(publicationsMock.create).mockClear();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPublicationsController],
      providers: [
        AdminPublicationsService,
        { provide: PublicationsService, useValue: publicationsMock },
        { provide: PublicationsImportService, useValue: importService },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const sampleBib = `@article{example2025,
  title   = {Example Paper Title},
  author  = {Researcher, A. and Collaborator, B.},
  year    = {2025},
  journal = {Example Venue},
  doi     = {10.0000/example}
}`;

  it('POST import/preview returns proposed title from BibTeX', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/publications/import/preview')
      .send({ source: 'bibtex', bibtex: sampleBib })
      .expect(201);

    expect(res.body.data.proposed.title).toBe('Example Paper Title');
    expect(res.body.data.duplicates).toEqual([]);
  });

  it('POST import/confirm create returns draft publication', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/publications/import/confirm')
      .send({
        source: 'bibtex',
        bibtex: sampleBib,
        action: 'create',
      })
      .expect(201);

    expect(res.body.data.publishStatus).toBe('draft');
    expect(res.body.data.title).toBe('Example Paper Title');
  });

  it('second import with same DOI shows duplicates on preview', async () => {
    store.set(
      PUB_ID,
      publicationRow({
        id: PUB_ID,
        doi: '10.0000/example',
        title: 'Existing',
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/publications/import/preview')
      .send({ source: 'bibtex', bibtex: sampleBib })
      .expect(201);

    expect(res.body.data.duplicates.length).toBeGreaterThan(0);
  });

  it('confirm create with duplicate DOI returns 409', async () => {
    store.set(
      PUB_ID,
      publicationRow({
        id: PUB_ID,
        doi: '10.0000/example',
      }),
    );

    await request(app.getHttpServer())
      .post('/api/v1/admin/publications/import/confirm')
      .send({
        source: 'bibtex',
        bibtex: sampleBib,
        action: 'create',
      })
      .expect(409);
  });

  it('merge keeps untouched fields', async () => {
    store.set(
      OTHER_ID,
      publicationRow({
        id: OTHER_ID,
        title: 'Kept title',
        abstract: 'Kept abstract',
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/publications/import/confirm')
      .send({
        source: 'bibtex',
        bibtex: sampleBib,
        action: 'merge',
        mergePublicationId: OTHER_ID,
        mergeFields: ['abstract'],
        overrides: { abstract: 'Merged abstract' },
      })
      .expect(201);

    expect(res.body.data.title).toBe('Kept title');
    expect(res.body.data.abstract).toBe('Merged abstract');
  });
});
