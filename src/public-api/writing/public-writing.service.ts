import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { MediaService } from '../../domain/media/media.service';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ResearchService } from '../../domain/research/research.service';
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
import { buildWritingRssFeed } from './writing-rss';

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
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
    private readonly research: ResearchService,
    private readonly media: MediaService,
    private readonly site: SiteService,
    private readonly appConfig: AppConfigService,
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

  private async attachCoversToWritingCards(
    cards: WritingPublicCard[],
    cache: Map<string, CoverResolved>,
  ): Promise<WritingPublicCard[]> {
    const rows = await Promise.all(
      cards.map(async (card) => {
        const row = await this.writing.findPublishedBySlug(card.slug);
        const cover = await this.resolveCover(row.coverMediaId, cache);
        return this.attachCoverToCard(card, cover);
      }),
    );
    return rows;
  }

  private async buildRelated(
    articleId: string,
    cache: Map<string, CoverResolved>,
  ): Promise<WritingPublicRelated> {
    const [
      publicationIds,
      projectIds,
      themeIds,
      relatedArticleIds,
    ] = await Promise.all([
      this.writing.listPublicationIdsForArticle(articleId),
      this.writing.listProjectIdsForArticle(articleId),
      this.writing.listThemeIdsForArticle(articleId),
      this.writing.listRelatedArticleIdsForArticle(articleId),
    ]);

    const [publicationCards, projectCards, themeCards, articleCards] =
      await Promise.all([
        this.publications.listPublishedCardsByIds(publicationIds),
        this.projects.listPublishedCardsByIds(projectIds),
        this.research.listPublishedThemeCardsByIds(themeIds),
        this.writing.listPublishedCardsByIds(relatedArticleIds),
      ]);

    const articlesWithCovers = await this.attachCoversToWritingCards(
      articleCards,
      cache,
    );

    if (
      publicationCards.length === 0 &&
      projectCards.length === 0 &&
      themeCards.length === 0 &&
      articlesWithCovers.length === 0
    ) {
      return EMPTY_RELATED;
    }

    return {
      articles: articlesWithCovers,
      publications: publicationCards,
      projects: projectCards,
      themes: themeCards,
    };
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
    const related = await this.buildRelated(row.id, cache);
    return {
      ...detail,
      ...(withCover.coverUrl
        ? { coverUrl: withCover.coverUrl, coverAlt: withCover.coverAlt }
        : {}),
      related,
    };
  }

  async getBySlug(slug: string): Promise<WritingPublicDetail> {
    const row = await this.writing.findPublishedBySlug(slug);
    const cache = new Map<string, CoverResolved>();
    const detail = await this.detailFromRow(row, cache);
    const [adjacent, seriesAdjacent, seriesRow] = await Promise.all([
      this.writing.adjacentPublishedSlugs(slug),
      this.writing.adjacentInSeriesSlugs(row),
      row.seriesId ? this.writing.getSeriesById(row.seriesId) : null,
    ]);
    return {
      ...detail,
      ...(adjacent.prevSlug ? { prevSlug: adjacent.prevSlug } : {}),
      ...(adjacent.nextSlug ? { nextSlug: adjacent.nextSlug } : {}),
      ...(seriesAdjacent.seriesPrevSlug
        ? { seriesPrevSlug: seriesAdjacent.seriesPrevSlug }
        : {}),
      ...(seriesAdjacent.seriesNextSlug
        ? { seriesNextSlug: seriesAdjacent.seriesNextSlug }
        : {}),
      ...(seriesRow
        ? { series: { slug: seriesRow.slug, title: seriesRow.title } }
        : {}),
    };
  }

  async previewById(id: string): Promise<WritingPublicDetail> {
    const row = await this.writing.findByIdAdmin(id);
    const cache = new Map<string, CoverResolved>();
    const detail = await this.detailFromRow(row, cache);
    const seriesAdjacent = await this.writing.adjacentInSeriesSlugs(row);
    const seriesRow = row.seriesId
      ? await this.writing.getSeriesById(row.seriesId)
      : null;
    return {
      ...detail,
      ...(seriesAdjacent.seriesPrevSlug
        ? { seriesPrevSlug: seriesAdjacent.seriesPrevSlug }
        : {}),
      ...(seriesAdjacent.seriesNextSlug
        ? { seriesNextSlug: seriesAdjacent.seriesNextSlug }
        : {}),
      ...(seriesRow
        ? { series: { slug: seriesRow.slug, title: seriesRow.title } }
        : {}),
    };
  }

  async buildRssFeed(): Promise<{ xml: string; etag: string }> {
    const settings = await this.site.getOrCreateSettings();
    const result = await this.writing.listPublishedPublic({
      page: 1,
      limit: 100,
      sort: 'publishedAtDesc',
    });
    const siteTitle = settings.siteName?.trim() || 'SIAM';
    return buildWritingRssFeed({
      siteTitle,
      siteOrigin: this.appConfig.frontendUrl.replace(/\/$/, ''),
      hubPath: '/writing',
      items: result.items,
    });
  }
}
