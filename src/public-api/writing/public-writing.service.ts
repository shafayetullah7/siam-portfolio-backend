import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';
import { SiteService } from '../../domain/site/site.service';
import { WritingService } from '../../domain/writing/writing.service';
import type {
  ArticleRow,
  WritingPublicCard,
  WritingPublicDetail,
  WritingPublicRelated,
} from '../../domain/writing/writing.types';
import type { ListPublicWritingQuery } from './dto/list-public-writing-query.dto';
import type { WritingPublicListDto } from './dto/writing-public-list.dto';

type CoverResolved = { url: string; alt: string | null } | null;

const EMPTY_RELATED: WritingPublicRelated = {
  articles: [],
  publications: [],
  projects: [],
  themes: [],
};

function shouldAttachSeriesSections(query: ListPublicWritingQuery): boolean {
  const page = query.page ?? 1;
  const sort = query.sort ?? 'publishedAtDesc';
  return (
    !query.q?.trim() &&
    !query.tag?.trim() &&
    !query.series?.trim() &&
    page === 1 &&
    sort === 'publishedAtDesc' &&
    query.featuredOnHub !== true
  );
}

@Injectable()
export class PublicWritingService {
  constructor(
    private readonly writing: WritingService,
    private readonly media: MediaService,
    private readonly site: SiteService,
  ) {}

  private async resolveCover(
    mediaId: string | null,
    cache: Map<string, CoverResolved>,
  ): Promise<CoverResolved> {
    if (!mediaId) return null;
    if (cache.has(mediaId)) {
      return cache.get(mediaId) ?? null;
    }
    try {
      const row = await this.media.findById(mediaId);
      const cover: CoverResolved = { url: row.url, alt: row.alt };
      cache.set(mediaId, cover);
      return cover;
    } catch (error) {
      if (error instanceof NotFoundException) {
        cache.set(mediaId, null);
        return null;
      }
      throw error;
    }
  }

  private attachCoverToCard(
    card: WritingPublicCard,
    cover: CoverResolved,
  ): WritingPublicCard {
    if (!cover?.url || !cover.alt?.trim()) {
      return card;
    }
    return {
      ...card,
      coverUrl: cover.url,
      coverAlt: cover.alt,
    };
  }

  private async cardFromRow(
    row: ArticleRow,
    cache: Map<string, CoverResolved>,
  ): Promise<WritingPublicCard> {
    const card = this.writing.toPublicCard(row);
    const cover = await this.resolveCover(row.coverMediaId, cache);
    return this.attachCoverToCard(card, cover);
  }

  async list(query: ListPublicWritingQuery): Promise<WritingPublicListDto> {
    const settings = await this.site.getOrCreateSettings();
    const sort = query.sort ?? 'publishedAtDesc';
    const result = await this.writing.listPublishedPublic({
      q: query.q,
      tag: query.tag,
      seriesSlug: query.series,
      sort,
      featuredOnHub: query.featuredOnHub,
      excludeFeaturedOnHub: query.excludeFeaturedOnHub,
      page: query.page,
      limit: query.limit,
    });
    const cache = new Map<string, CoverResolved>();
    const items = await Promise.all(
      result.items.map((row) => this.cardFromRow(row, cache)),
    );

    let seriesSections: WritingPublicListDto['seriesSections'];
    if (shouldAttachSeriesSections(query)) {
      const sections = await this.writing.listPublishedSeriesSections();
      seriesSections = await Promise.all(
        sections.map(async (section) => ({
          slug: section.series.slug,
          title: section.series.title,
          ...(section.series.summary
            ? { summary: section.series.summary }
            : {}),
          items: await Promise.all(
            section.articles.map((row) => this.cardFromRow(row, cache)),
          ),
        })),
      );
      if (seriesSections.length === 0) {
        seriesSections = undefined;
      }
    }

    return {
      intro: settings.writingHubIntro ?? null,
      items,
      meta: result.meta,
      ...(seriesSections ? { seriesSections } : {}),
    };
  }

  private async detailFromRow(
    row: ArticleRow,
    cache: Map<string, CoverResolved>,
  ): Promise<WritingPublicDetail> {
    const detail = this.writing.toPublicDetail(row);
    const cover = await this.resolveCover(row.coverMediaId, cache);
    const withCover = this.attachCoverToCard(
      this.writing.toPublicCard(row),
      cover,
    );
    return {
      ...detail,
      ...(withCover.coverUrl
        ? { coverUrl: withCover.coverUrl, coverAlt: withCover.coverAlt }
        : {}),
      related: EMPTY_RELATED,
    };
  }

  async getBySlug(slug: string): Promise<WritingPublicDetail> {
    const row = await this.writing.findPublishedBySlug(slug);
    const cache = new Map<string, CoverResolved>();
    const detail = await this.detailFromRow(row, cache);
    const adjacent = await this.writing.adjacentPublishedSlugs(slug);
    return {
      ...detail,
      ...(adjacent.prevSlug ? { prevSlug: adjacent.prevSlug } : {}),
      ...(adjacent.nextSlug ? { nextSlug: adjacent.nextSlug } : {}),
    };
  }

  async previewById(id: string): Promise<WritingPublicDetail> {
    const row = await this.writing.findByIdAdmin(id);
    const cache = new Map<string, CoverResolved>();
    return this.detailFromRow(row, cache);
  }
}
