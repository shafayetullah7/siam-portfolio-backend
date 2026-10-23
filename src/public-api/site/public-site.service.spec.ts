import { describe, expect, it, vi } from 'vitest';
import { PublicSiteService } from './public-site.service';

describe('PublicSiteService.getHome', () => {
  it('includes selectedProjects when the facade returns highlights', async () => {
    const site = { getPublicSite: vi.fn() };
    const profileHome = {
      getPublicHome: vi.fn().mockResolvedValue({
        heroTitle: 'Hello',
        heroSubtitle: null,
      }),
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
    expect(home.selectedProjects).toHaveLength(1);
    expect(home.selectedProjects?.[0].href).toBe('/projects/alpha');
  });
});
