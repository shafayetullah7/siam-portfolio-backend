import { INestApplication, NotFoundException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SiteService } from '../src/domain/site/site.service';
import { TimelineService } from '../src/domain/timeline/timeline.service';
import type {
  TimelinePublicCard,
  TimelinePublicDetail,
} from '../src/domain/timeline/timeline.types';
import { PublicTimelineController } from '../src/public-api/timeline/public-timeline.controller';
import { PublicTimelineService } from '../src/public-api/timeline/public-timeline.service';

describe('Public timeline (e2e)', () => {
  let app: INestApplication<App>;

  const awardCard: TimelinePublicCard = {
    id: '00000000-0000-4000-8000-000000000001',
    kind: 'award',
    title: 'Prize',
    subtitle: null,
    organization: 'Org',
    location: null,
    startDate: '2024-01-01',
    endDate: null,
    isOngoing: false,
    featured: false,
    proofUrl: 'https://example.com/proof',
    href: '/achievements/prize',
    images: [
      {
        url: 'https://img/1.jpg',
        alt: 'One',
        caption: null,
        sortOrder: 0,
      },
      {
        url: 'https://img/2.jpg',
        alt: '',
        caption: null,
        sortOrder: 1,
      },
    ],
  };

  const timelineMock: Partial<TimelineService> = {
    findPublishedBySlug: vi.fn(async (slug: string) => {
      if (slug === 'prize') {
        const detail: TimelinePublicDetail = {
          ...awardCard,
          summary: 'Summary',
          rankOrPlacement: null,
          eventName: null,
          credentialId: null,
          expiresAt: null,
          isCurrent: null,
          publicationId: null,
          projectId: null,
          seoTitle: null,
          seoDescription: null,
          publishStatus: 'published',
          publishedAt: new Date().toISOString(),
        };
        return detail;
      }
      return null;
    }),
    listPublishedAchievements: vi.fn(async () => [awardCard]),
    listPublishedExperience: vi.fn(async () => [
      {
        id: '00000000-0000-4000-8000-000000000002',
        kind: 'education',
        title: 'PhD',
        subtitle: null,
        organization: 'University',
        location: null,
        startDate: '2020-01-01',
        endDate: null,
        isOngoing: true,
        featured: false,
        proofUrl: null,
        images: [],
        summary: 'Research focus on ML',
        isCurrent: true,
      },
    ]),
    listPublishedByKinds: vi.fn(async () => [awardCard]),
    countPublishedByKinds: vi.fn(async () => 1),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicTimelineController],
      providers: [
        PublicTimelineService,
        { provide: TimelineService, useValue: timelineMock },
        {
          provide: SiteService,
          useValue: {
            getOrCreateSettings: vi.fn(async () => ({
              achievementsHubIntro: 'Achievements intro',
              experienceHubIntro: 'Experience intro',
            })),
          },
        },
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

  it('returns 404 for draft or missing slug', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/timeline/draft-slug')
      .expect(404);
  });

  it('lists achievements in grouped sections', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/timeline/achievements')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.intro).toBe('Achievements intro');
    expect(res.body.data.sections).toHaveLength(1);
    expect(res.body.data.sections[0].kind).toBe('award');
    expect(res.body.data.sections[0].items[0].title).toBe('Prize');
  });

  it('achievements route does not hit slug handler', async () => {
    timelineMock.findPublishedBySlug = vi.fn(async () => {
      throw new NotFoundException('should not be called');
    });

    await request(app.getHttpServer())
      .get('/api/v1/public/timeline/achievements')
      .expect(200);

    expect(timelineMock.findPublishedBySlug).not.toHaveBeenCalled();
  });

  it('slug detail preserves image order and omits empty alt', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/timeline/prize')
      .expect(200);

    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.images[0].alt).toBe('One');
    expect(res.body.data.proofUrl).toBe('https://example.com/proof');
  });

  it('lists experience with intro, summary, and no href for P10 slug', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/timeline/experience')
      .expect(200);

    expect(res.body.data.intro).toBe('Experience intro');
    expect(res.body.data.sections[0].kind).toBe('education');
    const item = res.body.data.sections[0].items[0];
    expect(item.summary).toBe('Research focus on ML');
    expect(item.isCurrent).toBe(true);
    expect(item.href).toBeUndefined();
  });

  it('unified list returns paginated items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/timeline')
      .expect(200);

    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.meta.total).toBe(1);
  });
});
