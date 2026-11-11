import {
  INestApplication,
  StandardSchemaValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminHomeController } from '../src/admin-api/profile-home/admin-home.controller';
import { AdminProfileController } from '../src/admin-api/profile-home/admin-profile.controller';
import { AdminProfileHomeService } from '../src/admin-api/profile-home/admin-profile-home.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';

const profileId = '00000000-0000-4000-8000-000000000010';
const homepageId = '00000000-0000-4000-8000-000000000011';

function mockAggregate() {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    profile: {
      id: profileId,
      headline: null,
      displayName: 'Ada',
      professionalTitle: null,
      contactEmail: null,
      shortBio: null,
      longBio: null,
      affiliation: null,
      affiliationRole: null,
      affiliationOrganization: null,
      affiliationLocation: null,
      portraitMediaId: null,
      scholarlyProfiles: null,
      researchStatement: null,
      expertise: null,
      collaborationInterests: null,
      publishStatus: 'draft',
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
    homepage: {
      id: homepageId,
      heroTitle: null,
      heroSubtitle: null,
      heroDescriptor: 'ML researcher',
      heroPositioning: null,
      statusBadge: null,
      primaryCtaLabel: null,
      primaryCtaHref: null,
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      heroMediaId: null,
      sections: [{ id: 'hero', visible: true }],
      highlights: null,
      currentlyWorkingOn: null,
      collaborationCta: null,
      profiles: null,
      seoTitle: null,
      seoDescription: null,
      publishStatus: 'draft',
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  };
}

describe('Admin profile-home (e2e)', () => {
  let app: INestApplication<App>;
  const getHomeAggregate = vi.fn();
  const getProfile = vi.fn();
  const updateHomepage = vi.fn();
  const updateProfile = vi.fn();
  const getHomepagePublishChecklist = vi.fn();
  const publishHomepage = vi.fn();
  const getHomePreview = vi.fn();
  const getFeaturedSummary = vi.fn();

  beforeEach(async () => {
    getHomeAggregate.mockReset();
    getProfile.mockReset();
    updateHomepage.mockReset();
    updateProfile.mockReset();
    getHomepagePublishChecklist.mockReset();
    publishHomepage.mockReset();
    getHomePreview.mockReset();
    getFeaturedSummary.mockReset();

    const aggregate = mockAggregate();
    getHomeAggregate.mockResolvedValue(aggregate);
    getProfile.mockResolvedValue(aggregate.profile);
    updateHomepage.mockImplementation(async (body: { heroDescriptor?: string }) => ({
      ...aggregate.homepage,
      ...body,
    }));
    updateProfile.mockImplementation(async (body: { displayName?: string }) => ({
      ...aggregate.profile,
      ...body,
    }));
    getHomepagePublishChecklist.mockResolvedValue({ errors: [], warnings: [] });
    publishHomepage.mockResolvedValue({
      ...aggregate.homepage,
      publishStatus: 'published',
    });
    getHomePreview.mockResolvedValue({
      published: false,
      visibleSectionIds: ['hero'],
      heroTitle: 'Preview',
      heroSubtitle: null,
      researchFocus: [],
    });
    getFeaturedSummary.mockResolvedValue({
      caps: { research: 6, publications: 4, projects: 3 },
      research: [],
      publications: [],
      projects: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminHomeController, AdminProfileController],
      providers: [
        {
          provide: AdminProfileHomeService,
          useValue: {
            getHomeAggregate,
            getProfile,
            updateHomepage,
            updateProfile,
            getHomepagePublishChecklist,
            publishHomepage,
            unpublishHomepage: vi.fn(),
            getHomePreview,
            getFeaturedSummary,
            getProfilePublishChecklist: vi.fn(),
            publishProfile: vi.fn(),
            unpublishProfile: vi.fn(),
          },
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

  it('GET admin/home returns aggregate and PATCH updates homepage', async () => {
    const getRes = await request(app.getHttpServer())
      .get('/api/v1/admin/home')
      .expect(200);

    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.profile.displayName).toBe('Ada');
    expect(getRes.body.data.homepage.heroDescriptor).toBe('ML researcher');

    const patchRes = await request(app.getHttpServer())
      .patch('/api/v1/admin/home')
      .send({ heroDescriptor: 'Updated descriptor' })
      .expect(200);

    expect(patchRes.body.data.heroDescriptor).toBe('Updated descriptor');
    expect(updateHomepage).toHaveBeenCalledWith({ heroDescriptor: 'Updated descriptor' });
  });

  it('GET and PATCH admin/profile', async () => {
    const getRes = await request(app.getHttpServer())
      .get('/api/v1/admin/profile')
      .expect(200);

    expect(getRes.body.data.displayName).toBe('Ada');

    await request(app.getHttpServer())
      .patch('/api/v1/admin/profile')
      .send({ displayName: 'Grace' })
      .expect(200);

    expect(updateProfile).toHaveBeenCalledWith({ displayName: 'Grace' });
  });

  it('GET admin/home/publish-check and preview', async () => {
    const checkRes = await request(app.getHttpServer())
      .get('/api/v1/admin/home/publish-check')
      .expect(200);
    expect(checkRes.body.data.errors).toEqual([]);

    const previewRes = await request(app.getHttpServer())
      .get('/api/v1/admin/home/preview')
      .expect(200);
    expect(previewRes.body.data.published).toBe(false);
    expect(previewRes.body.data.heroTitle).toBe('Preview');
  });

  it('POST admin/home/publish', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/home/publish')
      .send({})
      .expect(201);
    expect(publishHomepage).toHaveBeenCalled();
  });

  it('GET admin/home/featured-summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/home/featured-summary')
      .expect(200);
    expect(res.body.data.caps.publications).toBe(4);
    expect(getFeaturedSummary).toHaveBeenCalled();
  });
});

describe('Admin profile-home auth (e2e)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 when admin guard rejects', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminHomeController],
      providers: [
        {
          provide: AdminProfileHomeService,
          useValue: {
            getHomeAggregate: vi.fn(),
            getProfile: vi.fn(),
            updateHomepage: vi.fn(),
            updateProfile: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: vi.fn(() => {
          throw new UnauthorizedException();
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/admin/home').expect(401);
  });
});
