import { INestApplication, NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { ResearchService } from '../src/domain/research/research.service';
import { TalksService } from '../src/domain/talks/talks.service';
import { talkRow } from '../src/domain/talks/talks.test-helpers';
import type { TalkRow } from '../src/domain/talks/talks.types';
import { PublicTalksController } from '../src/public-api/talks/public-talks.controller';
import { PublicTalksService } from '../src/public-api/talks/public-talks.service';

describe('Public talks (e2e)', () => {
  let app: INestApplication<App>;
  const bySlug = new Map<string, TalkRow>();
  const byIdResources = new Map<
    string,
    { label: string; url: string; resourceType: string }[]
  >();

  const talksMock: Partial<TalksService> = {
    listPublicHub: vi.fn(async () => {
      const now = new Date();
      const rows = [...bySlug.values()].filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      );
      const upcoming = rows
        .filter((r) => r.startsAt > now)
        .map((r) => new TalksService({} as never).toPublicCard(r));
      const past = rows
        .filter((r) => r.startsAt <= now)
        .map((r) => new TalksService({} as never).toPublicCard(r));
      return { upcoming, past };
    }),
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = bySlug.get(slug);
      if (!row) throw new NotFoundException('Talk not found');
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        )
      ) {
        throw new NotFoundException('Talk not found');
      }
      return row;
    }),
    listResourcesForPublic: vi.fn(async (id: string) => {
      const rows = byIdResources.get(id) ?? [];
      return rows.map((r, i) => ({
        id: `res-${i}`,
        talkId: id,
        label: r.label,
        url: r.url,
        resourceType: r.resourceType as 'slides',
        sortOrder: i,
      }));
    }),
    getRelationsAdmin: vi.fn(async (id: string) => {
      const row = [...bySlug.values()].find((r) => r.id === id);
      if (!row) {
        return { publicationIds: [], projectIds: [], themeIds: [] };
      }
      return {
        publicationIds: ['pub-1'],
        projectIds: [],
        themeIds: [],
      };
    }),
    toPublicDetail: vi.fn((row, resources) => {
      const svc = new TalksService({} as never);
      return svc.toPublicDetail(row, resources);
    }),
  };

  const publicationsMock: Partial<PublicationsService> = {
    listPublishedCardsByIds: vi.fn(async () => [
      {
        slug: 'paper-one',
        title: 'Paper One',
        authorsShort: 'A. Author',
        year: 2025,
        venue: 'Conf',
        href: '/publications/paper-one',
      },
    ]),
  };

  const projectsMock: Partial<ProjectsService> = {
    listPublishedCardsByIds: vi.fn(async () => []),
  };

  const researchMock: Partial<ResearchService> = {
    listPublishedThemeCardsByIds: vi.fn(async () => []),
  };

  beforeEach(async () => {
    bySlug.clear();
    byIdResources.clear();
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicTalksController],
      providers: [
        PublicTalksService,
        { provide: TalksService, useValue: talksMock },
        { provide: PublicationsService, useValue: publicationsMock },
        { provide: ProjectsService, useValue: projectsMock },
        { provide: ResearchService, useValue: researchMock },
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

  it('returns empty hub when no published talks', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/talks')
      .expect(200);

    expect(res.body.data.intro).toBeNull();
    expect(res.body.data.upcoming).toEqual([]);
    expect(res.body.data.past).toEqual([]);
  });

  it('returns 404 for draft slug', async () => {
    bySlug.set('draft-talk', talkRow({ slug: 'draft-talk', publishStatus: 'draft' }));
    await request(app.getHttpServer())
      .get('/api/v1/public/talks/draft-talk')
      .expect(404);
  });

  it('returns detail with https resources and related publications', async () => {
    const row = talkRow({
      id: 'talk-pub',
      slug: 'live-talk',
      publishStatus: 'published',
      publishedAt: new Date(),
      startsAt: new Date('2024-01-01T10:00:00.000Z'),
    });
    bySlug.set('live-talk', row);
    byIdResources.set('talk-pub', [
      {
        label: 'Slides',
        url: 'https://example.com/slides',
        resourceType: 'slides',
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/public/talks/live-talk')
      .expect(200);

    expect(res.body.data.resources[0].url).toMatch(/^https:\/\//);
    expect(res.body.data.related.publications).toHaveLength(1);
    expect(res.body.data.related.publications[0].slug).toBe('paper-one');
  });
});
