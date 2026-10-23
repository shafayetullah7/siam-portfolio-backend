import { Injectable } from '@nestjs/common';
import { MediaService } from '../../domain/media/media.service';
import { TimelineService } from '../../domain/timeline/timeline.service';
import { PublicTimelineService } from '../../public-api/timeline/public-timeline.service';
import type {
  CreateTimelineEntryInput,
  TimelineEntryAdmin,
  TimelineEntryRow,
  UpdateTimelineEntryInput,
} from '../../domain/timeline/timeline.types';
import type { CreateTimelineEntryBody } from './dto/create-timeline-entry.dto';
import type { ListTimelineQuery } from './dto/list-timeline-query.dto';
import type { TimelineAdminResponse } from './dto/timeline-admin-response.dto';
import type { TimelineAdminSummary } from './dto/timeline-admin-summary.dto';
import type { PublishTimelineEntryBody } from './dto/publish-timeline-entry.dto';
import type { ReplaceTimelineEntryMediaBody } from './dto/replace-timeline-entry-media.dto';
import type { ScheduleTimelineEntryBody } from './dto/schedule-timeline-entry.dto';
import type { ReorderTimelineEntriesBody } from './dto/reorder-timeline-entries.dto';
import type { UpdateTimelineEntryBody } from './dto/update-timeline-entry.dto';

@Injectable()
export class AdminTimelineService {
  constructor(
    private readonly timeline: TimelineService,
    private readonly media: MediaService,
    private readonly publicTimeline: PublicTimelineService,
  ) {}

  private mapSummary(row: TimelineEntryRow): TimelineAdminSummary {
    return {
      id: row.id,
      kind: row.kind,
      title: row.title,
      slug: row.slug,
      publishStatus: row.publishStatus,
      organization: row.organization,
      startDate: row.startDate,
      endDate: row.endDate,
      isOngoing: row.isOngoing,
      featured: row.featured,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async enrichMediaLinks(
    entry: TimelineEntryAdmin,
  ): Promise<TimelineAdminResponse['mediaLinks']> {
    const links = await Promise.all(
      entry.media.map(async (link) => {
        const base = {
          id: link.id,
          mediaId: link.mediaId,
          sortOrder: link.sortOrder,
          caption: link.caption,
          imageRole: link.imageRole,
        };
        try {
          const row = await this.media.findById(link.mediaId);
          return { ...base, url: row.url, alt: row.alt };
        } catch {
          return base;
        }
      }),
    );
    return links;
  }

  private rowToAdminFields(
    row: TimelineEntryRow,
  ): Omit<TimelineAdminResponse, 'mediaLinks'> {
    return {
      id: row.id,
      kind: row.kind,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      organization: row.organization,
      location: row.location,
      startDate: row.startDate,
      endDate: row.endDate,
      isOngoing: row.isOngoing,
      isCurrent: row.isCurrent,
      proofUrl: row.proofUrl,
      rankOrPlacement: row.rankOrPlacement,
      eventName: row.eventName,
      credentialId: row.credentialId,
      expiresAt: row.expiresAt,
      featured: row.featured,
      sortOrder: row.sortOrder,
      publicationId: row.publicationId,
      projectId: row.projectId,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      hideFromSearch: row.hideFromSearch,
      metadata:
        row.metadata && typeof row.metadata === 'object'
          ? (row.metadata as Record<string, unknown>)
          : null,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async mapAdmin(entry: TimelineEntryAdmin): Promise<TimelineAdminResponse> {
    const mediaLinks = await this.enrichMediaLinks(entry);
    return {
      ...this.rowToAdminFields(entry),
      mediaLinks,
    };
  }

  private toCreateInput(body: CreateTimelineEntryBody): CreateTimelineEntryInput {
    return { ...body };
  }

  private toUpdateInput(body: UpdateTimelineEntryBody): UpdateTimelineEntryInput {
    return { ...body };
  }

  async list(query: ListTimelineQuery) {
    const result = await this.timeline.listAdmin({
      q: query.q,
      kind: query.kind,
      kinds: query.kinds,
      publishStatus: query.publishStatus,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });
    return {
      items: result.items.map((row) => this.mapSummary(row)),
      meta: result.meta,
    };
  }

  async get(id: string) {
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async create(body: CreateTimelineEntryBody) {
    const row = await this.timeline.create(this.toCreateInput(body));
    const entry = await this.timeline.findByIdAdmin(row.id);
    return await this.mapAdmin(entry);
  }

  async update(id: string, body: UpdateTimelineEntryBody) {
    await this.timeline.update(id, this.toUpdateInput(body));
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async replaceMedia(id: string, body: ReplaceTimelineEntryMediaBody) {
    await this.timeline.replaceEntryMedia(
      id,
      body.items.map((item) => ({
        mediaId: item.mediaId,
        sortOrder: item.sortOrder,
        caption: item.caption ?? null,
        imageRole: item.imageRole ?? null,
      })),
    );
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async preview(id: string) {
    return await this.publicTimeline.previewById(id);
  }

  async getPublishCheck(id: string) {
    return await this.timeline.getPublishChecklist(id);
  }

  async publish(id: string, body: PublishTimelineEntryBody) {
    await this.timeline.publish(id, {
      confirmWarnings: body.confirmWarnings,
    });
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async unpublish(id: string) {
    await this.timeline.unpublish(id);
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async archive(id: string) {
    await this.timeline.archive(id);
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async schedule(id: string, body: ScheduleTimelineEntryBody) {
    await this.timeline.schedule(id, new Date(body.scheduledAt));
    const entry = await this.timeline.findByIdAdmin(id);
    return await this.mapAdmin(entry);
  }

  async reorder(body: ReorderTimelineEntriesBody) {
    await this.timeline.reorderEntries({
      items: body.items,
      kinds: body.kinds,
    });
  }
}
