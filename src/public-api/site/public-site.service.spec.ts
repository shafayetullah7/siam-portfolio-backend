import { describe, expect, it, vi } from 'vitest';
import { PublicSiteService } from './public-site.service';

describe('PublicSiteService.getHome', () => {
  it('skips featured fetches when homepage is draft', async () => {
    const site = { getPublicSite: vi.fn() };
    const profileHome = {
      getPublicHomeForSiteFacade: vi.fn().mockResolvedValue({
        heroTitle: null,
        heroSubtitle: null,
        heroDescriptor: null,
        heroPositioning: null,
        statusBadge: null,
        primaryCta: null,
        secondaryCta: null,
        displayName: null,
        affiliationRole: null,
        affiliationOrganization: null,
        affiliationLocation: null,
        visibleSectionIds: ['hero'],
        highlights: null,
        currentlyWorkingOn: null,
        collaborationCta: null,
        profiles: null,
        seoTitle: null,
        seoDescription: null,
        heroPortraitUrl: null,
        heroPortraitAlt: null,
      }),
      isHomepagePublished: vi.fn().mockResolvedValue(false),
      getPublicAboutForSite: vi.fn(),
    };
    const publicResearch = {
      listFeaturedForHome: vi.fn(),
    };
    const publicPublications = {
      listFeaturedForHome: vi.fn(),
    };
    const publicProjects = {
      listFeaturedForHome: vi.fn(),
    };
    const service = new PublicSiteService(
      site as never,
      profileHome as never,
      publicResearch as never,
      publicPublications as never,
      publicProjects as never,
    );

    const home = await service.getHome();
    expect(home.published).toBe(false);
    expect(home.researchFocus).toEqual([]);
    expect(publicProjects.listFeaturedForHome).not.toHaveBeenCalled();
  });

  it('includes selectedProjects when homepage is published', async () => {
    const site = { getPublicSite: vi.fn() };
    const profileHome = {
      getPublicHomeForSiteFacade: vi.fn().mockResolvedValue({
        heroTitle: 'Hello',
        heroSubtitle: null,
        heroDescriptor: 'Desc',
        heroPositioning: 'Pos',
        statusBadge: null,
        primaryCta: null,
        secondaryCta: null,
        displayName: 'Ada',
        affiliationRole: null,
        affiliationOrganization: null,
        affiliationLocation: null,
        visibleSectionIds: ['hero', 'featuredProjects'],
        highlights: null,
        currentlyWorkingOn: null,
        collaborationCta: null,
        profiles: null,
        seoTitle: null,
        seoDescription: null,
        heroPortraitUrl: null,
        heroPortraitAlt: null,
      }),
      isHomepagePublished: vi.fn().mockResolvedValue(true),
      getPublicAboutForSite: vi.fn(),
    };
    const publicResearch = {
      listFeaturedForHome: vi.fn().mockResolvedValue([]),
    };
    const publicPublications = {
      listFeaturedForHome: vi.fn().mockResolvedValue([]),
    };
    const publicProjects = {
      listFeaturedForHome: vi.fn().mockResolvedValue([
        {
          title: 'Alpha',
          summary: 'S',
          href: '/projects/alpha',
          tags: ['ML'],
        },
      ]),
    };
    const service = new PublicSiteService(
      site as never,
      profileHome as never,
      publicResearch as never,
      publicPublications as never,
      publicProjects as never,
    );

    const home = await service.getHome();
    expect(home.published).toBe(true);
    expect(home.selectedProjects).toHaveLength(1);
    expect(home.selectedProjects?.[0].href).toBe('/projects/alpha');
  });
});

describe('PublicSiteService.getHomePreviewForAdmin', () => {
  it('uses draft shell with published response flag false', async () => {
    const site = { getPublicSite: vi.fn() };
    const draftShell = {
      heroTitle: 'Draft title',
      heroSubtitle: null,
      heroDescriptor: 'Desc',
      heroPositioning: 'Pos',
      statusBadge: null,
      primaryCta: null,
      secondaryCta: null,
      displayName: 'Ada',
      affiliationRole: null,
      affiliationOrganization: null,
      affiliationLocation: null,
      visibleSectionIds: ['hero'],
      highlights: null,
      currentlyWorkingOn: null,
      collaborationCta: null,
      profiles: null,
      seoTitle: null,
      seoDescription: null,
    };
    const profileHome = {
      getHomeShellDraft: vi.fn().mockResolvedValue(draftShell),
      getPublicAboutForSite: vi.fn(),
    };
    const publicResearch = {
      listFeaturedForHome: vi.fn().mockResolvedValue([]),
    };
    const publicPublications = {
      listFeaturedForHome: vi.fn().mockResolvedValue([]),
    };
    const publicProjects = {
      listFeaturedForHome: vi.fn().mockResolvedValue([]),
    };
    const service = new PublicSiteService(
      site as never,
      profileHome as never,
      publicResearch as never,
      publicPublications as never,
      publicProjects as never,
    );

    const home = await service.getHomePreviewForAdmin();
    expect(home.published).toBe(false);
    expect(home.heroTitle).toBe('Draft title');
    expect(publicResearch.listFeaturedForHome).toHaveBeenCalled();
  });
});
