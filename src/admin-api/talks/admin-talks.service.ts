import { Injectable } from '@nestjs/common';
import { TalksService } from '../../domain/talks/talks.service';
import type {
  CreateTalkInput,
  TalkRelations,
  TalkResourceRow,
  TalkRow,
  UpdateTalkInput,
} from '../../domain/talks/talks.types';
import type { CreateTalkBody } from './dto/create-talk.dto';
import type { ListTalksQuery } from './dto/list-talks-query.dto';
import type { PutTalkRelationsBody } from './dto/put-talk-relations.dto';
import type { PutTalkResourcesBody } from './dto/put-talk-resources.dto';
import type { TalkAdminDetail, TalkResourceAdminDto } from './dto/talk-admin-detail.dto';
import type { TalkAdminSummary } from './dto/talk-admin-summary.dto';
import type { PublishTalkBody } from './dto/publish-talk.dto';
import type { ScheduleTalkBody } from './dto/schedule-talk.dto';
import type { UpdateTalkBody } from './dto/update-talk.dto';

@Injectable()
export class AdminTalksService {
  constructor(private readonly talks: TalksService) {}

  private mapSummary(row: TalkRow): TalkAdminSummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      eventName: row.eventName,
      startsAt: row.startsAt.toISOString(),
      timezone: row.timezone,
      publishStatus: row.publishStatus,
      role: row.role,
      talkType: row.talkType,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapResource(row: TalkResourceRow): TalkResourceAdminDto {
    return {
      id: row.id,
      label: row.label,
      url: row.url,
      resourceType: row.resourceType,
      sortOrder: row.sortOrder,
    };
  }

  mapAdmin(
    row: TalkRow,
    resources: TalkResourceRow[],
    relations: TalkRelations,
  ): TalkAdminDetail {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      eventName: row.eventName,
      venue: row.venue,
      location: row.location,
      isOnline: row.isOnline,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      timezone: row.timezone,
      role: row.role,
      talkType: row.talkType,
      description: row.description,
      sortOrder: row.sortOrder,
      hideFromSearch: row.hideFromSearch,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resources: resources.map((r) => this.mapResource(r)),
      relations,
    };
  }

  private toCreateInput(body: CreateTalkBody): CreateTalkInput {
    return {
      slug: body.slug,
      title: body.title,
      eventName: body.eventName,
      timezone: body.timezone,
      startsAt: body.startsAt,
      endsAt: body.endsAt ?? null,
      venue: body.venue,
      location: body.location,
      isOnline: body.isOnline,
      role: body.role,
      talkType: body.talkType,
      description: body.description,
      sortOrder: body.sortOrder,
      hideFromSearch: body.hideFromSearch,
    };
  }

  private toUpdateInput(body: UpdateTalkBody): UpdateTalkInput {
    const input: UpdateTalkInput = {};
    if (body.slug !== undefined) input.slug = body.slug;
    if (body.title !== undefined) input.title = body.title;
    if (body.eventName !== undefined) input.eventName = body.eventName;
    if (body.timezone !== undefined) input.timezone = body.timezone;
    if (body.startsAt !== undefined) input.startsAt = body.startsAt;
    if (body.endsAt !== undefined) input.endsAt = body.endsAt;
    if (body.venue !== undefined) input.venue = body.venue;
    if (body.location !== undefined) input.location = body.location;
    if (body.isOnline !== undefined) input.isOnline = body.isOnline;
    if (body.role !== undefined) input.role = body.role;
    if (body.talkType !== undefined) input.talkType = body.talkType;
    if (body.description !== undefined) input.description = body.description;
    if (body.sortOrder !== undefined) input.sortOrder = body.sortOrder;
    if (body.hideFromSearch !== undefined) {
      input.hideFromSearch = body.hideFromSearch;
    }
    return input;
  }

  async list(query: ListTalksQuery) {
    const result = await this.talks.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
      talkType: query.talkType,
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
    const row = await this.talks.findByIdAdmin(id);
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }

  async create(body: CreateTalkBody) {
    const row = await this.talks.create(this.toCreateInput(body));
    return this.mapAdmin(row, [], {
      publicationIds: [],
      projectIds: [],
      themeIds: [],
    });
  }

  async update(id: string, body: UpdateTalkBody) {
    const row = await this.talks.update(id, this.toUpdateInput(body));
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }

  async putResources(id: string, body: PutTalkResourcesBody) {
    const resources = await this.talks.replaceTalkResources(
      id,
      body.resources,
    );
    const row = await this.talks.findByIdAdmin(id);
    const relations = await this.talks.getRelationsAdmin(id);
    return this.mapAdmin(row, resources, relations);
  }

  async putRelations(id: string, body: PutTalkRelationsBody) {
    const relations = await this.talks.replaceTalkRelations(id, body);
    const row = await this.talks.findByIdAdmin(id);
    const resources = await this.talks.listResourcesAdmin(id);
    return this.mapAdmin(row, resources, relations);
  }

  async delete(id: string) {
    await this.talks.delete(id);
  }

  async publishCheck(id: string) {
    return await this.talks.getPublishChecklist(id);
  }

  async publish(id: string, body: PublishTalkBody) {
    const row = await this.talks.publish(id, body);
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }

  async unpublish(id: string) {
    const row = await this.talks.unpublish(id);
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }

  async schedule(id: string, body: ScheduleTalkBody) {
    const row = await this.talks.schedule(
      id,
      new Date(body.scheduledAt),
      { confirmWarnings: body.confirmWarnings },
    );
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }

  async archive(id: string) {
    const row = await this.talks.archive(id);
    const [resources, relations] = await Promise.all([
      this.talks.listResourcesAdmin(id),
      this.talks.getRelationsAdmin(id),
    ]);
    return this.mapAdmin(row, resources, relations);
  }
}
