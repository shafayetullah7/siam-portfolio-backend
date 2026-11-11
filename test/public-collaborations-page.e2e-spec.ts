import { INestApplication } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { CollaborationsService } from '../src/domain/talks/collaborations.service';
import { AcademicServiceService } from '../src/domain/talks/academic-service.service';
import { MediaService } from '../src/domain/media/media.service';
import { SiteService } from '../src/domain/site/site.service';
import type { CollaborationRow } from '../src/domain/talks/talks.types';
import { PublicCollaborationsPageController } from '../src/public-api/collaborations/public-collaborations-page.controller';
import { PublicCollaborationsPageService } from '../src/public-api/collaborations/public-collaborations-page.service';

describe('Public collaborations page (e2e)', () => {
  let app: INestApplication<App>;

  const publishedRow: CollaborationRow = {
    id: 'c-pub',
    partnerName: 'Lab',
    summary: 'Work',
    institution: null,
    logoMediaId: 'media-1',
    role: null,
    period: null,
    outcomes: null,
    sortOrder: 0,
    publishStatus: 'published',
    publishedAt: new Date(),
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const collaborationsMock: Partial<CollaborationsService> = {
    listPublishedRowsForPublic: vi.fn(async () => [publishedRow]),
    toPublicCard: vi.fn((row) => ({
      partnerName: row.partnerName,
      summary: row.summary,
      institution: row.institution,
      role: row.role,
      period: row.period,
      outcomes: row.outcomes,
      logo: null,
    })),
  };

  const academicMock: Partial<AcademicServiceService> = {
    listPublishedPublic: vi.fn(async () => []),
  };

  const siteMock: Partial<SiteService> = {
    getOrCreateSettings: vi.fn(async () => ({
      collaborationsPageEnabled: false,
      collaborationsPageIntro: 'Intro text',
    })),
  };

  const mediaMock: Partial<MediaService> = {
    findById: vi.fn(async () => ({
      url: 'https://cdn.example/logo.png',
      alt: 'Partner logo',
    })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicCollaborationsPageController],
      providers: [
        PublicCollaborationsPageService,
        { provide: CollaborationsService, useValue: collaborationsMock },
        { provide: AcademicServiceService, useValue: academicMock },
        { provide: SiteService, useValue: siteMock },
        { provide: MediaService, useValue: mediaMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns pageEnabled false when site flag off despite published rows', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/collaborations-page')
      .expect(200);

    expect(res.body.data.pageEnabled).toBe(false);
    expect(res.body.data.collaborations).toEqual([]);
    expect(res.body.data.intro).toBe('Intro text');
  });

  it('returns pageEnabled true with logos when flag on', async () => {
    siteMock.getOrCreateSettings = vi.fn(async () => ({
      collaborationsPageEnabled: true,
      collaborationsPageIntro: null,
    }));

    const res = await request(app.getHttpServer())
      .get('/api/v1/public/collaborations-page')
      .expect(200);

    expect(res.body.data.pageEnabled).toBe(true);
    expect(res.body.data.collaborations).toHaveLength(1);
    expect(res.body.data.collaborations[0].logo).toEqual({
      url: 'https://cdn.example/logo.png',
      alt: 'Partner logo',
    });
  });
});
