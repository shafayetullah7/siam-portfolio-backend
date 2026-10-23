import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SiteService } from './site.service';

const settingsRow = {
  id: 'site-1',
  siteName: 'SIAM',
  defaultMetaDescription: null,
  footerText: null,
  researchHubIntro: null,
  projectsHubIntro: null,
  writingHubIntro: null,
  achievementsHubIntro: null,
  experienceHubIntro: null,
  contactFormEnabled: true,
  contactPageIntro: 'Get in touch',
  contactCollaborationGuidance: null,
  contactResponseTimeNote: null,
  contactCategories: ['Collaboration', 'Speaking'],
  contactConsentText: 'I agree to be contacted.',
  contactSuccessMessage: 'Thanks — your message was received.',
  contactPublicEmail: 'researcher@example.edu',
  contactShowEmailOnPage: true,
  faviconUrl: null,
  faviconMediaId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const imageMedia = {
  id: 'media-1',
  fileName: 'icon.png',
  mimeType: 'image/png',
  size: 100,
  url: 'https://res.cloudinary.com/demo/icon.png',
  alt: null,
  caption: null,
  license: null,
  usesCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createSiteService(db: unknown) {
  const sitePages = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
  const research = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
  const publications = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
  const projects = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
  const writing = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
  const timeline = {
    listPublishedAchievementSlugs: vi.fn().mockResolvedValue([]),
  };
  return new SiteService(
    db as never,
    sitePages as never,
    research as never,
    publications as never,
    projects as never,
    writing as never,
    timeline as never,
  );
}

describe('SiteService.getPublicSite', () => {
  it('includes research hub and published theme slugs in sitemapPaths', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([settingsRow]),
        })),
      })),
    };
    const sitePages = {
      listPublishedSlugs: vi.fn().mockResolvedValue(['about-page']),
    };
    const research = {
      listPublishedSlugs: vi.fn().mockResolvedValue(['alpha', 'beta']),
    };
    const publications = {
      listPublishedSlugs: vi.fn().mockResolvedValue(['paper-a']),
    };
    const projects = {
      listPublishedSlugs: vi.fn().mockResolvedValue(['case-study']),
    };
    const writing = {
      listPublishedSlugs: vi.fn().mockResolvedValue(['essay-a']),
    };
    const timeline = {
      listPublishedAchievementSlugs: vi.fn().mockResolvedValue([]),
    };
    const service = new SiteService(
      db as never,
      sitePages as never,
      research as never,
      publications as never,
      projects as never,
      writing as never,
      timeline as never,
    );
    vi.spyOn(service, 'listNav').mockResolvedValue([]);

    const site = await service.getPublicSite();
    expect(site.sitemapPaths).toEqual([
      '/research',
      '/research/alpha',
      '/research/beta',
      '/publications',
      '/publications/paper-a',
      '/projects',
      '/projects/case-study',
      '/writing',
      '/writing/essay-a',
      '/',
      '/about',
      '/pages/about-page',
    ]);
  });

  it('includes achievements hub and slugs when published P09 entries exist', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([settingsRow]),
        })),
      })),
    };
    const timeline = {
      listPublishedAchievementSlugs: vi.fn().mockResolvedValue(['prize']),
    };
    const service = new SiteService(
      db as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      timeline as never,
    );
    vi.spyOn(service, 'listNav').mockResolvedValue([]);

    const site = await service.getPublicSite();
    expect(site.sitemapPaths).toContain('/achievements');
    expect(site.sitemapPaths).toContain('/achievements/prize');
  });

  it('omits writing paths when no published articles', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([settingsRow]),
        })),
      })),
    };
    const writing = { listPublishedSlugs: vi.fn().mockResolvedValue([]) };
    const timeline = {
      listPublishedAchievementSlugs: vi.fn().mockResolvedValue([]),
    };
    const service = new SiteService(
      db as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      { listPublishedSlugs: vi.fn().mockResolvedValue([]) } as never,
      writing as never,
      timeline as never,
    );
    vi.spyOn(service, 'listNav').mockResolvedValue([]);

    const site = await service.getPublicSite();
    expect(site.sitemapPaths.some((p) => p === '/writing')).toBe(false);
  });
});

describe('SiteService.getContactConfig', () => {
  it('maps site settings to public contact config', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([settingsRow]),
        })),
      })),
    };
    const service = createSiteService(db);
    const config = await service.getContactConfig();
    expect(config.formEnabled).toBe(true);
    expect(config.intro).toBe('Get in touch');
    expect(config.categories).toEqual(['Collaboration', 'Speaking']);
    expect(config.consentText).toBe('I agree to be contacted.');
    expect(config.publicEmail).toBe('researcher@example.edu');
    expect(config.showEmailOnPage).toBe(true);
  });
});

describe('SiteService.updateSettings', () => {
  it('syncs faviconUrl when faviconMediaId is set', async () => {
    let selectPass = 0;
    const db = {
      select: vi.fn(() => {
        selectPass += 1;
        if (selectPass === 1) {
          return {
            from: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([settingsRow]),
            })),
          };
        }
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([imageMedia]),
            })),
          })),
        };
      }),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                ...settingsRow,
                faviconMediaId: 'media-1',
                faviconUrl: imageMedia.url,
              },
            ]),
          })),
        })),
      })),
    };
    const service = createSiteService(db);

    const row = await service.updateSettings({ faviconMediaId: 'media-1' });
    expect(row.faviconUrl).toBe(imageMedia.url);
    expect(row.faviconMediaId).toBe('media-1');
  });

  it('throws when favicon media is not an image', async () => {
    let selectPass = 0;
    const pdfMedia = { ...imageMedia, mimeType: 'application/pdf' };
    const db = {
      select: vi.fn(() => {
        selectPass += 1;
        if (selectPass === 1) {
          return {
            from: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([settingsRow]),
            })),
          };
        }
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([pdfMedia]),
            })),
          })),
        };
      }),
    };
    const service = createSiteService(db);

    await expect(
      service.updateSettings({ faviconMediaId: 'media-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when favicon media id is missing', async () => {
    let selectPass = 0;
    const db = {
      select: vi.fn(() => {
        selectPass += 1;
        if (selectPass === 1) {
          return {
            from: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([settingsRow]),
            })),
          };
        }
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        };
      }),
    };
    const service = createSiteService(db);

    await expect(
      service.updateSettings({ faviconMediaId: 'media-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
