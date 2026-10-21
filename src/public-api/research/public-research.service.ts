import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ResearchService } from '../../domain/research/research.service';
import { SiteService } from '../../domain/site/site.service';
import type { HomeResearchFocusPublic } from '../site/dto/public-home.dto';
import type { ResearchThemeRow } from '../../domain/research/research.types';
import type { ResearchThemePublicCard } from './dto/research-theme-public-card.dto';
import type { ResearchThemePublicDetail } from './dto/research-theme-public-detail.dto';
import type { ResearchThemePublicList } from './dto/research-theme-public-list.dto';

type CoverResolved = { url: string; alt: string | null } | null;

@Injectable()
export class PublicResearchService {
  constructor(
    private readonly research: ResearchService,
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
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

  private hrefFor(slug: string): string {
    return `/research/${slug}`;
  }

  private async mapCard(
    row: ResearchThemeRow,
    cache: Map<string, CoverResolved>,
    publicationCounts: Map<string, number>,
    projectCounts: Map<string, number>,
  ): Promise<ResearchThemePublicCard> {
    const cover = await this.resolveCover(row.coverMediaId, cache);
    const pubCount = publicationCounts.get(row.id) ?? 0;
    const projectCount = projectCounts.get(row.id) ?? 0;
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      themeStatus: row.themeStatus,
      tags: row.tags,
      coverUrl: cover?.url ?? null,
      coverAlt: cover?.alt ?? null,
      href: this.hrefFor(row.slug),
      relatedCounts: { publications: pubCount, projects: projectCount },
    };
  }

  private async mapDetail(
    row: ResearchThemeRow,
    cache: Map<string, CoverResolved>,
  ): Promise<ResearchThemePublicDetail> {
    const cover = await this.resolveCover(row.coverMediaId, cache);
    const resourceRows = await this.research.listResources(row.id);
    const resources =
      resourceRows.length > 0
        ? resourceRows.map((r) => ({
            label: r.label,
            url: r.url,
            resourceType: r.resourceType,
          }))
        : undefined;
    const [publicationIds, projectIds] = await Promise.all([
      this.research.listPublicationIdsForTheme(row.id),
      this.research.listProjectIdsForTheme(row.id),
    ]);
    const [publicationCards, projectCards] = await Promise.all([
      this.publications.listPublishedCardsByIds(publicationIds),
      this.projects.listPublishedCardsByIds(projectIds),
    ]);
    const related =
      publicationCards.length > 0 ||
      projectCards.length > 0
        ? {
            publications: publicationCards,
            projects: projectCards,
            talks: [] as [],
          }
        : undefined;
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      themeStatus: row.themeStatus,
      tags: row.tags,
      linkLabel: row.linkLabel,
      problem: row.problem,
      significance: row.significance,
      objectives: row.objectives,
      approach: row.approach,
      findings: row.findings,
      limitations: row.limitations,
      futureWork: row.futureWork,
      collaborators: row.collaborators,
      acknowledgments: row.acknowledgments,
      funding: row.funding,
      ...(resources ? { resources } : {}),
      ...(related ? { related } : {}),
      ...(cover ? { cover } : {}),
      seo: {
        title: row.seoTitle ?? row.title,
        description: row.seoDescription ?? row.summary,
      },
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(): Promise<ResearchThemePublicCard[]> {
    const rows = await this.research.listPublished();
    const cache = new Map<string, CoverResolved>();
    const themeIds = rows.map((row) => row.id);
    const [publicationCounts, projectCounts] = await Promise.all([
      this.publications.countPublishedForThemeIds(themeIds),
      this.projects.countPublishedForThemeIds(themeIds),
    ]);
    return Promise.all(
      rows.map((row) =>
        this.mapCard(row, cache, publicationCounts, projectCounts),
      ),
    );
  }

  async listHub(): Promise<ResearchThemePublicList> {
    const settings = await this.site.getOrCreateSettings();
    const items = await this.list();
    return {
      intro: settings.researchHubIntro ?? null,
      items,
    };
  }

  cardToHomeFocus(card: ResearchThemePublicCard): HomeResearchFocusPublic {
    return {
      title: card.title,
      description: card.summary,
      href: card.href,
      ...(card.tags?.length ? { tags: card.tags } : {}),
      coverUrl: card.coverUrl ?? null,
      coverAlt: card.coverAlt ?? null,
    };
  }

  async listFeaturedForHome(): Promise<HomeResearchFocusPublic[]> {
    const rows = await this.research.listPublishedFeaturedForHome();
    const cache = new Map<string, CoverResolved>();
    const themeIds = rows.map((row) => row.id);
    const [publicationCounts, projectCounts] = await Promise.all([
      this.publications.countPublishedForThemeIds(themeIds),
      this.projects.countPublishedForThemeIds(themeIds),
    ]);
    const cards = await Promise.all(
      rows.map((row) =>
        this.mapCard(row, cache, publicationCounts, projectCounts),
      ),
    );
    return cards.map((card) => this.cardToHomeFocus(card));
  }

  async getBySlug(slug: string): Promise<ResearchThemePublicDetail> {
    const row = await this.research.findPublishedBySlug(slug);
    const cache = new Map<string, CoverResolved>();
    const detail = await this.mapDetail(row, cache);
    const adjacent = await this.research.adjacentPublishedSlugs(slug);
    return {
      ...detail,
      ...(adjacent.prevSlug ? { prevSlug: adjacent.prevSlug } : {}),
      ...(adjacent.nextSlug ? { nextSlug: adjacent.nextSlug } : {}),
    };
  }

  async previewById(id: string): Promise<ResearchThemePublicDetail> {
    const row = await this.research.findByIdAdmin(id);
    const cache = new Map<string, CoverResolved>();
    return this.mapDetail(row, cache);
  }
}
