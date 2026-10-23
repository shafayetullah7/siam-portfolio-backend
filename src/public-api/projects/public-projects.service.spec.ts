import { describe, expect, it, vi } from 'vitest';
import { PublicProjectsService } from './public-projects.service';

describe('PublicProjectsService.list', () => {
  it('maps domain list and intro from site settings', async () => {
    const projects = {
      listPublishedPublic: vi.fn().mockResolvedValue({
        items: [
          {
            slug: 'alpha',
            title: 'Alpha',
            summary: 'S',
            href: '/projects/alpha',
            projectType: 'open_source',
            projectStatus: 'completed',
          },
        ],
        meta: {
          page: 1,
          limit: 24,
          itemCount: 1,
          total: 1,
          totalPages: 1,
        },
      }),
    };
    const site = {
      getOrCreateSettings: vi.fn().mockResolvedValue({
        projectsHubIntro: 'Custom intro',
      }),
    };
    const service = new PublicProjectsService(
      projects as never,
      {} as never,
      site as never,
      {} as never,
      {} as never,
    );

    const result = await service.list({
      page: 1,
      limit: 24,
      projectType: 'open_source',
    });

    expect(projects.listPublishedPublic).toHaveBeenCalledWith({
      q: undefined,
      tag: undefined,
      projectType: 'open_source',
      projectStatus: undefined,
      featured: undefined,
      excludeFeatured: undefined,
      page: 1,
      limit: 24,
    });
    expect(result.intro).toBe('Custom intro');
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });
});

describe('PublicProjectsService.listFeaturedForHome', () => {
  it('maps published featured rows to home highlights', async () => {
    const projects = {
      listPublishedFeaturedForHome: vi.fn().mockResolvedValue([
        {
          id: 'p1',
          slug: 'alpha',
          title: 'Alpha',
          summary: 'Summary',
          coverMediaId: null,
          projectType: 'open_source',
          projectStatus: 'completed',
          tags: ['ML'],
        },
      ]),
      loadResourcesForProject: vi.fn().mockResolvedValue([]),
      toPublicCard: vi.fn().mockReturnValue({
        slug: 'alpha',
        title: 'Alpha',
        summary: 'Summary',
        href: '/projects/alpha',
        projectType: 'open_source',
        projectStatus: 'completed',
        tags: ['ML'],
      }),
    };
    const service = new PublicProjectsService(
      projects as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const items = await service.listFeaturedForHome();
    expect(items).toEqual([
      {
        title: 'Alpha',
        summary: 'Summary',
        href: '/projects/alpha',
        tags: ['ML'],
      },
    ]);
  });
});
