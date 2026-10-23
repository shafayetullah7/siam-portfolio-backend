import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PublicationsService } from '../../domain/publications/publications.service';
import { publicationRow } from '../../domain/publications/publications.service.spec';
import { PublicPublicationsService } from './public-publications.service';

describe('PublicPublicationsService', () => {
  const domain = new PublicationsService({} as never, {} as never);

  it('maps listPublishedPublic to cards with meta', async () => {
    const rows = [
      publicationRow({
        slug: 'a',
        title: 'Alpha',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
      publicationRow({
        slug: 'b',
        title: 'Beta',
        publishStatus: 'published',
        publishedAt: new Date(),
      }),
    ];
    const publications: Partial<PublicationsService> = {
      listPublishedPublic: vi.fn().mockResolvedValue({
        items: rows,
        meta: {
          page: 1,
          limit: 24,
          itemCount: 2,
          total: 2,
          totalPages: 1,
        },
      }),
      toPublicCard: (row) => domain.toPublicCard(row),
    };
    const service = new PublicPublicationsService(
      publications as PublicationsService,
    );

    const result = await service.list({ q: 'beta', page: 1, limit: 24 });
    expect(publications.listPublishedPublic).toHaveBeenCalledWith({
      q: 'beta',
      year: undefined,
      publicationType: undefined,
      themeSlug: undefined,
      page: 1,
      limit: 24,
    });
    expect(result.items).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.items[0].featured).toBe(false);
  });

  it('getBySlug maps detail', async () => {
    const row = publicationRow({
      slug: 'live',
      publishStatus: 'published',
      publishedAt: new Date(),
      abstract: 'Abs',
    });
    const publications: Partial<PublicationsService> = {
      findPublishedBySlug: vi.fn().mockResolvedValue(row),
      toPublicDetailForPublication: vi.fn(async (r) => domain.toPublicDetail(r)),
    };
    const service = new PublicPublicationsService(
      publications as PublicationsService,
    );

    const detail = await service.getBySlug('live');
    expect(detail.slug).toBe('live');
    expect(detail.abstract).toBe('Abs');
  });

  it('getBibtex returns citation from domain', async () => {
    const row = publicationRow({
      slug: 'live',
      title: 'Live Paper',
      publishStatus: 'published',
      publishedAt: new Date(),
    });
    const citation = {
      citeKey: 'live',
      bibtex: '@misc{live,}',
      formatted: 'Author (2024). Live Paper.',
    };
    const publications: Partial<PublicationsService> = {
      findPublishedBySlug: vi.fn().mockResolvedValue(row),
      formatCitationForPublication: vi.fn().mockResolvedValue(citation),
    };
    const service = new PublicPublicationsService(
      publications as PublicationsService,
    );

    const result = await service.getBibtex('live');
    expect(result).toEqual(citation);
  });

  it('propagates not found from domain', async () => {
    const publications: Partial<PublicationsService> = {
      findPublishedBySlug: vi
        .fn()
        .mockRejectedValue(new NotFoundException('Publication not found')),
    };
    const service = new PublicPublicationsService(
      publications as PublicationsService,
    );

    await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
