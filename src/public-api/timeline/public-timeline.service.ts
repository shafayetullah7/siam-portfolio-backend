import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ACHIEVEMENT_KINDS,
  ALL_TIMELINE_KINDS,
  EXPERIENCE_KINDS,
  type TimelineEntryKind,
} from '../../domain/timeline/timeline-kinds';
import { SiteService } from '../../domain/site/site.service';
import { TimelineService } from '../../domain/timeline/timeline.service';
import type {
  ListPublishedByKindsOptions,
  TimelinePublicCard,
  TimelinePublicDetail,
  TimelinePublicImage,
} from '../../domain/timeline/timeline.types';
import type { ListPublicTimelineQuery } from './dto/list-public-timeline-query.dto';
import type { TimelinePublicCardDto } from './dto/timeline-public-card.dto';
import type { TimelinePublicDetailDto } from './dto/timeline-public-detail.dto';
import type { TimelinePublicGroupedListDto } from './dto/timeline-public-grouped-list.dto';
import type { TimelinePublicListDto } from './dto/timeline-public-list.dto';

export function filterPublicImages(
  images: TimelinePublicImage[],
): TimelinePublicImage[] {
  return images
    .filter((img) => Boolean(img.url) && Boolean(img.alt?.trim()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

@Injectable()
export class PublicTimelineService {
  constructor(
    private readonly timeline: TimelineService,
    private readonly site: SiteService,
  ) {}

  private listOptionsFromQuery(
    query: ListPublicTimelineQuery,
  ): ListPublishedByKindsOptions {
    return {
      featuredOnly: query.featured === true ? true : undefined,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    };
  }

  private mapCard(card: TimelinePublicCard): TimelinePublicCardDto {
    return {
      id: card.id,
      kind: card.kind,
      title: card.title,
      subtitle: card.subtitle,
      organization: card.organization,
      location: card.location,
      startDate: card.startDate,
      endDate: card.endDate,
      isOngoing: card.isOngoing,
      featured: card.featured,
      proofUrl: card.proofUrl,
      images: filterPublicImages(card.images),
      ...(card.href ? { href: card.href } : {}),
      ...(card.expiresAt !== undefined ? { expiresAt: card.expiresAt } : {}),
      ...(card.summary !== undefined ? { summary: card.summary } : {}),
      ...(card.isCurrent !== undefined ? { isCurrent: card.isCurrent } : {}),
    };
  }

  private mapDetail(detail: TimelinePublicDetail): TimelinePublicDetailDto {
    const card = this.mapCard(detail);
    return {
      ...card,
      summary: detail.summary,
      rankOrPlacement: detail.rankOrPlacement,
      eventName: detail.eventName,
      credentialId: detail.credentialId,
      expiresAt: detail.expiresAt,
      isCurrent: detail.isCurrent,
      publicationId: detail.publicationId,
      projectId: detail.projectId,
      seoTitle: detail.seoTitle,
      seoDescription: detail.seoDescription,
      publishStatus: detail.publishStatus,
      publishedAt: detail.publishedAt,
    };
  }

  private buildSections(
    cards: TimelinePublicCardDto[],
    kindOrder: readonly TimelineEntryKind[],
  ): TimelinePublicGroupedListDto {
    const sections = kindOrder
      .map((kind) => ({
        kind,
        items: cards.filter((card) => card.kind === kind),
      }))
      .filter((section) => section.items.length > 0);
    return { intro: null, sections };
  }

  async listAchievements(
    query: ListPublicTimelineQuery,
  ): Promise<TimelinePublicGroupedListDto> {
    const settings = await this.site.getOrCreateSettings();
    const cards = await this.timeline.listPublishedAchievements(
      this.listOptionsFromQuery(query),
    );
    const grouped = this.buildSections(
      cards.map((card) => this.mapCard(card)),
      ACHIEVEMENT_KINDS,
    );
    return {
      ...grouped,
      intro: settings.achievementsHubIntro ?? null,
    };
  }

  async listExperience(
    query: ListPublicTimelineQuery,
  ): Promise<TimelinePublicGroupedListDto> {
    const settings = await this.site.getOrCreateSettings();
    const cards = await this.timeline.listPublishedExperience(
      this.listOptionsFromQuery(query),
    );
    const grouped = this.buildSections(
      cards.map((card) => this.mapCard(card)),
      EXPERIENCE_KINDS,
    );
    return {
      ...grouped,
      intro: settings.experienceHubIntro ?? null,
    };
  }

  private resolveKinds(
    query: ListPublicTimelineQuery,
  ): readonly TimelineEntryKind[] {
    if (query.kinds && query.kinds.length > 0) {
      return query.kinds;
    }
    if (query.kind) {
      return [query.kind];
    }
    return ALL_TIMELINE_KINDS;
  }

  async listAll(query: ListPublicTimelineQuery): Promise<TimelinePublicListDto> {
    const kinds = this.resolveKinds(query);
    const options = this.listOptionsFromQuery(query);
    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 24, 1), 100);

    const [items, total] = await Promise.all([
      this.timeline.listPublishedByKinds(kinds, { ...options, page, limit }),
      this.timeline.countPublishedByKinds(kinds, options),
    ]);

    return {
      items: items.map((card) => this.mapCard(card)),
      meta: { page, limit, total },
    };
  }

  async getBySlug(slug: string): Promise<TimelinePublicDetailDto> {
    const detail = await this.timeline.findPublishedBySlug(slug);
    if (!detail) {
      throw new NotFoundException('Timeline entry not found');
    }
    return this.mapDetail(detail);
  }

  async previewById(id: string): Promise<TimelinePublicDetailDto> {
    const entry = await this.timeline.findByIdAdmin(id);
    const images = await this.timeline.resolvePublicImages(id);
    const { media: _media, ...row } = entry;
    return this.mapDetail(this.timeline.toPublicDetail(row, images));
  }
}
