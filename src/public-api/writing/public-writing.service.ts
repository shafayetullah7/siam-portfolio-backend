import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';
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

@Injectable()
export class PublicWritingService {
  constructor(
    private readonly writing: WritingService,
    private readonly media: MediaService,
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
    const result = await this.writing.listPublishedPublic({
      q: query.q,
      tag: query.tag,
      featuredOnHub: query.featuredOnHub,
      excludeFeaturedOnHub: query.excludeFeaturedOnHub,
      page: query.page,
      limit: query.limit,
    });
    const cache = new Map<string, CoverResolved>();
    const items = await Promise.all(
      result.items.map((row) => this.cardFromRow(row, cache)),
    );
    return {
      intro: null,
      items,
      meta: result.meta,
    };
  }

  private async detailFromRow(
    row: ArticleRow,
    cache: Map<string, CoverResolved>,
  ): Promise<WritingPublicDetail> {
    const base = this.writing.toPublicDetail(row);
    const cover = await this.resolveCover(row.coverMediaId, cache);
    const card = this.attachCoverToCard(base, cover);
    return {
      ...card,
      body: base.body,
      ...(base.subtitle !== undefined ? { subtitle: base.subtitle } : {}),
      ...(base.byline !== undefined ? { byline: base.byline } : {}),
      related: EMPTY_RELATED,
      ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
      ...(row.seoDescription ? { seoDescription: row.seoDescription } : {}),
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
