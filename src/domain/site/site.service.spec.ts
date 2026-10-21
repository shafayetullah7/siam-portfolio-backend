import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SiteService } from './site.service';

const settingsRow = {
  id: 'site-1',
  siteName: 'SIAM',
  defaultMetaDescription: null,
  footerText: null,
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
  return new SiteService(db as never, sitePages as never, research as never);
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
    const service = new SiteService(
      db as never,
      sitePages as never,
      research as never,
    );
    vi.spyOn(service, 'listNav').mockResolvedValue([]);

    const site = await service.getPublicSite();
    expect(site.sitemapPaths).toEqual([
      '/research',
      '/research/alpha',
      '/research/beta',
      '/',
      '/about',
      '/pages/about-page',
    ]);
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
