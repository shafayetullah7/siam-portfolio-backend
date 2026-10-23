import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ResearchService } from '../../domain/research/research.service';
import { SiteService } from '../../domain/site/site.service';
import { enrichProjectPublicDetail } from './project-public-detail-enrichment';
import type { ProjectPublicDetailEnriched } from '../../domain/projects/projects.types';
import type { ProjectPublicCard } from '../../domain/projects/projects.types';
import type { HomeProjectHighlightPublic } from '../site/dto/public-home.dto';
import type { ListPublicProjectsQuery } from './dto/list-public-projects-query.dto';
import type { ProjectPublicListDto } from './dto/project-public-list.dto';

type CoverResolved = { url: string; alt: string | null } | null;

@Injectable()
export class PublicProjectsService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly media: MediaService,
    private readonly site: SiteService,
    private readonly publications: PublicationsService,
    private readonly research: ResearchService,
  ) {}

  async enrichPublicDetail(
    projectId: string,
    detail: import('../../domain/projects/projects.types').ProjectPublicDetail,
    options: {
      cover?: CoverResolved;
      prevSlug?: string;
      nextSlug?: string;
    } = {},
  ): Promise<ProjectPublicDetailEnriched> {
    const row = await this.projects.findByIdAdmin(projectId);
    return enrichProjectPublicDetail(
      this.projects,
      this.publications,
      this.research,
      row,
      detail,
      options,
    );
  }

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

  cardToHomeHighlight(card: ProjectPublicCard): HomeProjectHighlightPublic {
    const alt = card.coverAlt?.trim() ?? '';
    return {
      title: card.title,
      summary: card.summary,
      href: card.href,
      ...(card.tags?.length ? { tags: card.tags } : {}),
      ...(card.coverUrl && alt
        ? { coverUrl: card.coverUrl, coverAlt: card.coverAlt ?? null }
        : {}),
    };
  }

  async listFeaturedForHome(): Promise<HomeProjectHighlightPublic[]> {
    const rows = await this.projects.listPublishedFeaturedForHome();
    const cache = new Map<string, CoverResolved>();
    const cards = await Promise.all(
      rows.map(async (row) => {
        const resources = await this.projects.loadResourcesForProject(row.id);
        const card = this.projects.toPublicCard(row, resources);
        if (!row.coverMediaId) return card;
        const cover = await this.resolveCover(row.coverMediaId, cache);
        if (!cover) return card;
        return {
          ...card,
          coverUrl: cover.url,
          coverAlt: cover.alt,
        };
      }),
    );
    return cards.map((card) => this.cardToHomeHighlight(card));
  }

  async list(query: ListPublicProjectsQuery): Promise<ProjectPublicListDto> {
    const settings = await this.site.getOrCreateSettings();
    const result = await this.projects.listPublishedPublic({
      q: query.q,
      tag: query.tag,
      projectType: query.projectType,
      projectStatus: query.projectStatus,
      featured: query.featured,
      excludeFeatured: query.excludeFeatured,
      page: query.page,
      limit: query.limit,
    });
    return {
      intro: settings.projectsHubIntro ?? null,
      items: result.items,
      meta: result.meta,
    };
  }

  async getBySlug(slug: string): Promise<ProjectPublicDetailEnriched> {
    const row = await this.projects.findPublishedBySlug(slug);
    const cache = new Map<string, CoverResolved>();
    const [sections, resources, metrics, adjacent, cover] = await Promise.all([
      this.projects.loadSectionsForProject(row.id),
      this.projects.loadResourcesForProject(row.id),
      this.projects.loadMetricsForProject(row.id),
      this.projects.adjacentPublishedSlugs(slug),
      this.resolveCover(row.coverMediaId, cache),
    ]);
    const detail = this.projects.toPublicDetail(
      row,
      sections,
      resources,
      metrics,
    );
    return enrichProjectPublicDetail(
      this.projects,
      this.publications,
      this.research,
      row,
      detail,
      {
        ...(cover ? { cover } : {}),
        ...(adjacent.prevSlug ? { prevSlug: adjacent.prevSlug } : {}),
        ...(adjacent.nextSlug ? { nextSlug: adjacent.nextSlug } : {}),
      },
    );
  }
}
