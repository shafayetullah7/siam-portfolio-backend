import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { isPubliclyVisible } from '../src/common/publishing/is-publicly-visible';
import type { PublishStatus } from '../src/common/publishing/publish-status';
import { MediaService } from '../src/domain/media/media.service';
import { ProjectsService } from '../src/domain/projects/projects.service';
import { PublicationsService } from '../src/domain/publications/publications.service';
import { publicationRow } from '../src/domain/publications/publications.service.spec';
import type { PublicationRow } from '../src/domain/publications/publications.types';
import { ResearchService } from '../src/domain/research/research.service';
import { SiteService } from '../src/domain/site/site.service';
import type { ResearchThemeRow } from '../src/domain/research/research.types';

const COVER_MEDIA_ID = '00000000-0000-4000-8000-000000000099';

function themeRow(
  overrides: Partial<ResearchThemeRow> & { slug: string; title: string },
): ResearchThemeRow {
  const now = new Date();
  return {
    id: '00000000-0000-4000-8000-000000000001',
    slug: overrides.slug,
    title: overrides.title,
    summary: overrides.summary ?? 'Summary text',
    themeStatus: overrides.themeStatus ?? 'ongoing',
    problem: overrides.problem ?? 'Problem',
    significance: overrides.significance ?? null,
    objectives: overrides.objectives ?? null,
    approach: overrides.approach ?? null,
    findings: overrides.findings ?? null,
    limitations: overrides.limitations ?? null,
    futureWork: overrides.futureWork ?? null,
    tags: overrides.tags ?? ['ml'],
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

const LINKED_PUB_ID = '00000000-0000-4000-8000-000000000020';

describe('Public research themes (e2e)', () => {
  let app: INestApplication<App>;
  const themes = new Map<string, ResearchThemeRow>();
  let linkedPublication: PublicationRow = publicationRow({
    id: LINKED_PUB_ID,
    slug: 'linked-paper',
    title: 'Linked Paper',
    authorsShort: 'Author et al.',
    year: 2024,
    venue: 'NeurIPS',
    publicationType: 'conference',
    publishStatus: 'published',
    publishedAt: new Date(),
  });

  const researchMock: Partial<ResearchService> = {
    findPublishedBySlug: vi.fn(async (slug: string) => {
      const row = themes.get(slug);
      if (!row) {
        throw new NotFoundException('Research theme not found');
      }
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        )
      ) {
        throw new NotFoundException('Research theme not found');
      }
      return row;
    }),
    listPublished: vi.fn(async () => {
      return [...themes.values()]
        .filter((row) =>
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ),
        )
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
        );
    }),
    listPublishedSlugs: vi.fn(async () => {
      const rows = await researchMock.listPublished!();
      return rows.map((row) => row.slug);
    }),
    adjacentPublishedSlugs: vi.fn(async (slug: string) => {
      const slugs = await researchMock.listPublishedSlugs!();
      const index = slugs.indexOf(slug);
      if (index === -1) return {};
      return {
        ...(index > 0 ? { prevSlug: slugs[index - 1] } : {}),
        ...(index < slugs.length - 1 ? { nextSlug: slugs[index + 1] } : {}),
      };
    }),
    listProjectIdsForTheme: vi.fn(async (themeId: string) => {
      if (themeId !== '00000000-0000-4000-8000-000000000001') {
        return [];
      }
      return [LINKED_PROJECT_ID];
    }),
    listPublicationIdsForTheme: vi.fn(async (themeId: string) => {
      if (themeId !== '00000000-0000-4000-8000-000000000001') {
        return [];
      }
      return [LINKED_PUB_ID];
    }),
    listResources: vi.fn(async (themeId: string) => {
      if (themeId !== '00000000-0000-4000-8000-000000000001') {
        return [];
      }
      return [
        {
          id: '00000000-0000-4000-8000-000000000010',
          themeId,
          sortOrder: 0,
          label: 'Code repository',
          url: 'https://github.com/example/repo',
          resourceType: 'code' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }),
    listPublishedFeaturedForHome: vi.fn(async () => {
      return [...themes.values()].filter(
        (row) =>
          row.featuredOnHome &&
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
          ),
      );
    }),
  };

  const LINKED_PROJECT_ID = '00000000-0000-4000-8000-000000000021';
  let linkedProjectPublished = true;

  const projectsMock: Partial<ProjectsService> = {
    listPublishedCardsByIds: vi.fn(async (ids: string[]) => {
      if (!ids.includes(LINKED_PROJECT_ID) || !linkedProjectPublished) {
        return [];
      }
      return [
        {
          slug: 'linked-project',
          title: 'Linked Project',
          summary: 'Summary',
          href: '/projects/linked-project',
          projectType: 'open_source',
          projectStatus: 'completed',
        },
      ];
    }),
    countPublishedForThemeIds: vi.fn(async (themeIds: string[]) => {
      const map = new Map<string, number>();
      for (const id of themeIds) {
        if (id === '00000000-0000-4000-8000-000000000001' && linkedProjectPublished) {
          map.set(id, 1);
        }
      }
      return map;
    }),
  };

  const publicationsMock: Partial<PublicationsService> = {
    listPublishedCardsByIds: vi.fn(async (ids: string[]) => {
      if (ids.length === 0) return [];
      if (!ids.includes(LINKED_PUB_ID)) return [];
      if (
        !isPubliclyVisible(
          linkedPublication.publishStatus as PublishStatus,
          linkedPublication.scheduledAt,
        )
      ) {
        return [];
      }
      return [
        {
          slug: linkedPublication.slug,
          title: linkedPublication.title,
          authorsShort: linkedPublication.authorsShort,
          year: linkedPublication.year,
          venue: linkedPublication.venue,
          publicationType: linkedPublication.publicationType,
          href: `/publications/${linkedPublication.slug}`,
        },
      ];
    }),
    countPublishedForThemeIds: vi.fn(async (themeIds: string[]) => {
      const map = new Map<string, number>();
      for (const id of themeIds) {
        if (id === '00000000-0000-4000-8000-000000000001') {
          map.set(id, 1);
        }
      }
      return map;
    }),
  };

  const siteMock: Partial<SiteService> = {
    getOrCreateSettings: vi.fn(async () => ({
      id: '00000000-0000-4000-8000-000000000002',
      siteName: 'SIAM',
      defaultMetaDescription: null,
      footerText: null,
      researchHubIntro: 'Custom hub intro',
      faviconUrl: null,
      faviconMediaId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };

  const mediaMock: Partial<MediaService> = {
    findById: vi.fn(async (id: string) => {
      if (id !== COVER_MEDIA_ID) {
        throw new NotFoundException('Media not found');
      }
      return {
        id,
        fileName: 'cover.jpg',
        url: 'https://cdn.example/cover.jpg',
        mimeType: 'image/jpeg',
        size: 1000,
        alt: 'Cover alt',
        caption: null,
        license: null,
        usesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),
  };

  beforeEach(async () => {
    themes.clear();
    linkedProjectPublished = true;
    linkedPublication = publicationRow({
      id: LINKED_PUB_ID,
      slug: 'linked-paper',
      title: 'Linked Paper',
      authorsShort: 'Author et al.',
      year: 2024,
      venue: 'NeurIPS',
      publicationType: 'conference',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    themes.set(
      'draft-theme',
      themeRow({ slug: 'draft-theme', title: 'Draft', publishStatus: 'draft' }),
    );
    themes.set(
      'live-theme',
      themeRow({
        slug: 'live-theme',
        title: 'Published',
        publishStatus: 'published',
        publishedAt: new Date(),
        coverMediaId: COVER_MEDIA_ID,
        seoTitle: 'SEO title',
        sortOrder: 1,
      }),
    );
    themes.set(
      'first-theme',
      themeRow({
        slug: 'first-theme',
        title: 'First',
        publishStatus: 'published',
        publishedAt: new Date(),
        sortOrder: 0,
      }),
    );
    themes.set(
      'third-theme',
      themeRow({
        slug: 'third-theme',
        title: 'Third',
        publishStatus: 'published',
        publishedAt: new Date(),
        sortOrder: 2,
      }),
    );
    themes.set(
      'scheduled-theme',
      themeRow({
        slug: 'scheduled-theme',
        title: 'Scheduled',
        publishStatus: 'scheduled',
        scheduledAt: new Date(Date.now() + 60_000),
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ResearchService)
      .useValue(researchMock)
      .overrideProvider(PublicationsService)
      .useValue(publicationsMock)
      .overrideProvider(ProjectsService)
      .useValue(projectsMock)
      .overrideProvider(MediaService)
      .useValue(mediaMock)
      .overrideProvider(SiteService)
      .useValue(siteMock)
      .compile();

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
      .get('/api/v1/public/research-themes/draft-theme')
      .expect(404);
  });

  it('returns 404 for scheduled theme before due time', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/scheduled-theme')
      .expect(404);
  });

  it('lists only published themes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.intro).toBe('Custom hub intro');
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.items.map((i: { slug: string }) => i.slug)).toEqual([
      'first-theme',
      'live-theme',
      'third-theme',
    ]);
    const liveItem = res.body.data.items.find(
      (i: { slug: string }) => i.slug === 'live-theme',
    );
    expect(liveItem.href).toBe('/research/live-theme');
    expect(liveItem.coverUrl).toBe('https://cdn.example/cover.jpg');
    expect(liveItem.relatedCounts).toEqual({
      publications: 1,
      projects: 1,
    });
  });

  it('returns detail with seo and cover', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/live-theme')
      .expect(200);

    expect(res.body.data.seo.title).toBe('SEO title');
    expect(res.body.data.seo.description).toBe('Summary text');
    expect(res.body.data.cover).toEqual({
      url: 'https://cdn.example/cover.jpg',
      alt: 'Cover alt',
    });
    expect(res.body.data.resources).toEqual([
      {
        label: 'Code repository',
        url: 'https://github.com/example/repo',
        resourceType: 'code',
      },
    ]);
    expect(res.body.data.related?.publications).toEqual([
      {
        slug: 'linked-paper',
        title: 'Linked Paper',
        authorsShort: 'Author et al.',
        year: 2024,
        venue: 'NeurIPS',
        publicationType: 'conference',
        href: '/publications/linked-paper',
      },
    ]);
    expect(res.body.data.prevSlug).toBe('first-theme');
    expect(res.body.data.nextSlug).toBe('third-theme');
  });

  it('returns prevSlug only for first published theme in order', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/first-theme')
      .expect(200);

    expect(res.body.data.prevSlug).toBeUndefined();
    expect(res.body.data.nextSlug).toBe('live-theme');
  });

  it('omits draft linked publication from theme detail; shows when published', async () => {
    linkedPublication = publicationRow({
      ...linkedPublication,
      publishStatus: 'draft',
      publishedAt: null,
    });

    const draftRes = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/live-theme')
      .expect(200);

    expect(draftRes.body.data.related?.publications ?? []).toEqual([]);

    linkedPublication = publicationRow({
      ...linkedPublication,
      publishStatus: 'published',
      publishedAt: new Date(),
    });

    const liveRes = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/live-theme')
      .expect(200);

    expect(liveRes.body.data.related?.publications).toEqual([
      {
        slug: 'linked-paper',
        title: 'Linked Paper',
        authorsShort: 'Author et al.',
        year: 2024,
        venue: 'NeurIPS',
        publicationType: 'conference',
        href: '/publications/linked-paper',
      },
    ]);
  });

  it('omits draft linked project from theme detail; shows when published', async () => {
    linkedProjectPublished = false;

    const draftRes = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/live-theme')
      .expect(200);

    expect(draftRes.body.data.related?.projects ?? []).toEqual([]);

    linkedProjectPublished = true;

    const liveRes = await request(app.getHttpServer())
      .get('/api/v1/public/research-themes/live-theme')
      .expect(200);

    expect(liveRes.body.data.related?.projects).toEqual([
      {
        slug: 'linked-project',
        title: 'Linked Project',
        summary: 'Summary',
        href: '/projects/linked-project',
        projectType: 'open_source',
        projectStatus: 'completed',
      },
    ]);
  });
});
