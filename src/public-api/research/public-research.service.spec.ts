import { describe, expect, it, vi } from 'vitest';
import { PublicResearchService } from './public-research.service';

describe('PublicResearchService.previewById', () => {
  it('maps draft admin row to public detail shape', async () => {
    const row = {
      id: 'theme-1',
      slug: 'draft-theme',
      title: 'Draft title',
      summary: 'Summary',
      themeStatus: 'ongoing' as const,
      problem: 'Problem text',
      significance: null,
      objectives: 'Objectives',
      approach: null,
      findings: null,
      limitations: null,
      futureWork: null,
      tags: ['ml'],
      linkLabel: null,
      coverMediaId: null,
      sortOrder: 0,
      featuredOnHome: false,
      publishStatus: 'draft' as const,
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
      seoTitle: null,
      seoDescription: null,
      collaborators: null,
      acknowledgments: null,
      funding: null,
      createdAt: new Date(),
      updatedAt: new Date('2026-01-15T12:00:00.000Z'),
    };

    const research = {
      findByIdAdmin: vi.fn().mockResolvedValue(row),
      listResources: vi.fn().mockResolvedValue([]),
      listPublicationIdsForTheme: vi.fn().mockResolvedValue([]),
      listProjectIdsForTheme: vi.fn().mockResolvedValue([]),
    };
    const publications = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const projects = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const media = { findById: vi.fn() };
    const site = {
      getOrCreateSettings: vi.fn().mockResolvedValue({ researchHubIntro: null }),
    };
    const service = new PublicResearchService(
      research as never,
      publications as never,
      projects as never,
      media as never,
      site as never,
    );

    const detail = await service.previewById('theme-1');
    expect(detail.slug).toBe('draft-theme');
    expect(detail.problem).toBe('Problem text');
    expect(detail.seo).toEqual({
      title: 'Draft title',
      description: 'Summary',
    });
    expect(detail.updatedAt).toBe('2026-01-15T12:00:00.000Z');
    expect(detail).not.toHaveProperty('publishStatus');
    expect(detail).not.toHaveProperty('id');
  });
});

describe('PublicResearchService.listHub', () => {
  it('returns intro from site settings and published items', async () => {
    const research = {
      listPublished: vi.fn().mockResolvedValue([
        {
          id: 'theme-1',
          slug: 'live',
          title: 'Live',
          summary: 'S',
          themeStatus: 'ongoing',
          tags: null,
          coverMediaId: null,
          linkLabel: null,
        },
      ]),
    };
    const publications = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const projects = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const media = { findById: vi.fn() };
    const site = {
      getOrCreateSettings: vi.fn().mockResolvedValue({
        researchHubIntro: 'Intro text',
      }),
    };
    const service = new PublicResearchService(
      research as never,
      publications as never,
      projects as never,
      media as never,
      site as never,
    );
    const hub = await service.listHub();
    expect(hub.intro).toBe('Intro text');
    expect(hub.items).toHaveLength(1);
    expect(hub.items[0].slug).toBe('live');
  });
});

describe('PublicResearchService.getBySlug', () => {
  it('includes adjacent published slugs on public detail only', async () => {
    const row = {
      id: 'theme-2',
      slug: 'middle',
      title: 'Middle',
      summary: 'S',
      themeStatus: 'ongoing' as const,
      problem: 'P',
      significance: null,
      objectives: null,
      approach: null,
      findings: null,
      limitations: null,
      futureWork: null,
      tags: null,
      linkLabel: null,
      coverMediaId: null,
      sortOrder: 1,
      featuredOnHome: false,
      publishStatus: 'published' as const,
      publishedAt: new Date(),
      scheduledAt: null,
      archivedAt: null,
      seoTitle: null,
      seoDescription: null,
      collaborators: null,
      acknowledgments: null,
      funding: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const research = {
      findPublishedBySlug: vi.fn().mockResolvedValue(row),
      listResources: vi.fn().mockResolvedValue([]),
      listPublicationIdsForTheme: vi.fn().mockResolvedValue([]),
      listProjectIdsForTheme: vi.fn().mockResolvedValue([]),
      adjacentPublishedSlugs: vi.fn().mockResolvedValue({
        prevSlug: 'first',
        nextSlug: 'last',
      }),
    };
    const publications = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const projects = {
      listPublishedCardsByIds: vi.fn().mockResolvedValue([]),
      countPublishedForThemeIds: vi.fn().mockResolvedValue(new Map()),
    };
    const media = { findById: vi.fn() };
    const site = {
      getOrCreateSettings: vi.fn().mockResolvedValue({ researchHubIntro: null }),
    };
    const service = new PublicResearchService(
      research as never,
      publications as never,
      projects as never,
      media as never,
      site as never,
    );

    const detail = await service.getBySlug('middle');
    expect(detail.prevSlug).toBe('first');
    expect(detail.nextSlug).toBe('last');
  });
});
