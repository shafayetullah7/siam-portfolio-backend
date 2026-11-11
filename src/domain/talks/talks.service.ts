import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lte,
  ne,
  or,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  buildPaginatedResponse,
  type PaginatedResponse,
} from '../../common/pagination/paginated-response';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import {
  talkProjects,
  talkPublications,
  talkResearchThemes,
} from '../../db/schema/talks/talk-junctions';
import { talkResources } from '../../db/schema/talks/talk-resources';
import { talks } from '../../db/schema/talks/talks';
import {
  normalizeTalkResourceInputs,
  trimTalkOptional,
  type TalkResourceWrite,
} from './talk-child-inputs';
import {
  assertRelationIdLimits,
  dedupeIds,
} from './talk-relations';
import { talkPublishChecklist } from './talk-publish-checklist';
import { normalizeTalkSlug } from './talk-slug';
import type {
  CreateTalkInput,
  ReplaceTalkRelationsInput,
  TalkPublicCard,
  TalkPublicDetail,
  TalkPublicHub,
  TalkPublicResource,
  TalkThemeRelatedCard,
  TalkRelations,
  TalkResourceRow,
  TalkRow,
  ListAdminTalksQuery,
  ListAdminTalksSort,
  PublishTalkOptions,
  UpdateTalkInput,
} from './talks.types';

const DEFAULT_ADMIN_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

export function talkVisibleSql(now: Date): SQL {
  return or(
    eq(talks.publishStatus, 'published'),
    and(eq(talks.publishStatus, 'scheduled'), lte(talks.scheduledAt, now)),
  )!;
}

@Injectable()
export class TalksService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  hrefForSlug(slug: string): string {
    return `/talks/${slug}`;
  }

  toPublicCard(row: TalkRow): TalkPublicCard {
    return {
      slug: row.slug,
      title: row.title,
      eventName: row.eventName,
      startsAt: row.startsAt.toISOString(),
      timezone: row.timezone,
      role: row.role,
      talkType: row.talkType,
      isOnline: row.isOnline,
      location: row.location,
      venue: row.venue,
      description: row.description,
    };
  }

  toPublicDetail(
    row: TalkRow,
    resources: TalkResourceRow[],
  ): TalkPublicDetail {
    const mappedResources: TalkPublicResource[] = resources.map((r) => ({
      label: r.label,
      url: r.url,
      resourceType: r.resourceType,
    }));
    return {
      ...this.toPublicCard(row),
      endsAt: row.endsAt ? row.endsAt.toISOString() : null,
      resources: mappedResources,
      related: {
        publications: [],
        projects: [],
        themes: [],
      },
    };
  }

  private valuesFromCreate(input: CreateTalkInput): typeof talks.$inferInsert {
    let publishStatus: PublishStatus = input.publishStatus ?? 'draft';
    if ((input.role ?? 'speaker') === 'attendee') {
      publishStatus = 'draft';
    }
    return {
      slug: normalizeTalkSlug(input.slug),
      title: input.title.trim(),
      eventName: input.eventName.trim(),
      timezone: input.timezone.trim(),
      startsAt: input.startsAt,
      venue: trimTalkOptional(input.venue),
      location: trimTalkOptional(input.location),
      isOnline: input.isOnline ?? false,
      endsAt: input.endsAt ?? null,
      role: input.role ?? 'speaker',
      talkType: input.talkType ?? 'other',
      description: trimTalkOptional(input.description),
      sortOrder: input.sortOrder ?? 0,
      hideFromSearch: input.hideFromSearch ?? false,
      publishStatus,
    };
  }

  async create(input: CreateTalkInput): Promise<TalkRow> {
    try {
      const [row] = await this.db
        .insert(talks)
        .values(this.valuesFromCreate(input))
        .returning();
      if (!row) {
        throw new Error('Failed to create talk');
      }
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateTalkInput): Promise<TalkRow> {
    await this.findByIdAdmin(id);
    const patch: Record<string, unknown> = {};
    if (input.slug !== undefined) {
      patch.slug = normalizeTalkSlug(input.slug);
    }
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.eventName !== undefined) patch.eventName = input.eventName.trim();
    if (input.timezone !== undefined) patch.timezone = input.timezone.trim();
    if (input.startsAt !== undefined) patch.startsAt = input.startsAt;
    if (input.endsAt !== undefined) patch.endsAt = input.endsAt;
    if (input.venue !== undefined) patch.venue = trimTalkOptional(input.venue);
    if (input.location !== undefined) {
      patch.location = trimTalkOptional(input.location);
    }
    if (input.isOnline !== undefined) patch.isOnline = input.isOnline;
    if (input.role !== undefined) patch.role = input.role;
    if (input.talkType !== undefined) patch.talkType = input.talkType;
    if (input.description !== undefined) {
      patch.description = trimTalkOptional(input.description);
    }
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.hideFromSearch !== undefined) {
      patch.hideFromSearch = input.hideFromSearch;
    }
    if (input.publishStatus !== undefined) {
      const role = (input.role ??
        (await this.findByIdAdmin(id)).role) as TalkRow['role'];
      if (role === 'attendee' && input.publishStatus === 'published') {
        patch.publishStatus = 'draft';
      } else {
        patch.publishStatus = input.publishStatus;
      }
    }

    try {
      const [row] = await this.db
        .update(talks)
        .set(patch)
        .where(eq(talks.id, id))
        .returning();
      if (!row) {
        throw new NotFoundException('Talk not found');
      }
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  private orderByForAdminList(sort?: ListAdminTalksSort) {
    switch (sort ?? 'updatedAtDesc') {
      case 'startsAtDesc':
        return [desc(talks.startsAt), desc(talks.updatedAt)];
      case 'startsAtAsc':
        return [asc(talks.startsAt), asc(talks.title)];
      case 'titleAsc':
        return [asc(talks.title), asc(talks.slug)];
      case 'updatedAtDesc':
      default:
        return [desc(talks.updatedAt), desc(talks.startsAt)];
    }
  }

  async listAdmin(
    query: ListAdminTalksQuery = {},
  ): Promise<PaginatedResponse<TalkRow>> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_ADMIN_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(talks.title, pattern),
          ilike(talks.slug, pattern),
          ilike(talks.eventName, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(talks.publishStatus, query.publishStatus));
    }
    if (query.talkType) {
      conditions.push(eq(talks.talkType, query.talkType));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(talks)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(talks)
      .where(whereClause)
      .orderBy(...this.orderByForAdminList(query.sort))
      .limit(limit)
      .offset(offset);

    const total = Number(countRow?.total ?? 0);
    return buildPaginatedResponse(items, { page, limit, total });
  }

  async delete(id: string): Promise<void> {
    await this.findByIdAdmin(id);
    await this.db.delete(talks).where(eq(talks.id, id));
  }

  async findByIdAdmin(id: string): Promise<TalkRow> {
    const [row] = await this.db
      .select()
      .from(talks)
      .where(eq(talks.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Talk not found');
    }
    return row;
  }

  async findPublishedBySlug(slug: string, now = new Date()): Promise<TalkRow> {
    const normalized = slug.trim();
    const [row] = await this.db
      .select()
      .from(talks)
      .where(eq(talks.slug, normalized))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Talk not found');
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      )
    ) {
      throw new NotFoundException('Talk not found');
    }
    return row;
  }

  async listPublishedTalkIdsForTheme(
    themeId: string,
    now = new Date(),
  ): Promise<string[]> {
    const rows = await this.db
      .select({
        talkId: talks.id,
        publishStatus: talks.publishStatus,
        scheduledAt: talks.scheduledAt,
      })
      .from(talkResearchThemes)
      .innerJoin(talks, eq(talkResearchThemes.talkId, talks.id))
      .where(and(eq(talkResearchThemes.themeId, themeId), talkVisibleSql(now)))
      .orderBy(asc(talkResearchThemes.sortOrder), desc(talks.startsAt));

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .map((row) => row.talkId);
  }

  async listPublishedRelatedCardsForTheme(
    themeId: string,
    now = new Date(),
  ): Promise<TalkThemeRelatedCard[]> {
    const rows = await this.db
      .select({
        slug: talks.slug,
        title: talks.title,
        eventName: talks.eventName,
        startsAt: talks.startsAt,
        talkType: talks.talkType,
        publishStatus: talks.publishStatus,
        scheduledAt: talks.scheduledAt,
      })
      .from(talkResearchThemes)
      .innerJoin(talks, eq(talkResearchThemes.talkId, talks.id))
      .where(and(eq(talkResearchThemes.themeId, themeId), talkVisibleSql(now)))
      .orderBy(asc(talkResearchThemes.sortOrder), desc(talks.startsAt));

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .map((row) => ({
        slug: row.slug,
        title: row.title,
        eventName: row.eventName,
        startsAt: row.startsAt.toISOString(),
        talkType: row.talkType,
      }));
  }

  async listPublishedSlugs(now = new Date()): Promise<string[]> {
    const rows = await this.db
      .select({ slug: talks.slug, startsAt: talks.startsAt, publishStatus: talks.publishStatus, scheduledAt: talks.scheduledAt })
      .from(talks)
      .where(talkVisibleSql(now));

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .sort((a, b) => {
        const byDate = b.startsAt.getTime() - a.startsAt.getTime();
        if (byDate !== 0) return byDate;
        return a.slug.localeCompare(b.slug);
      })
      .map((row) => row.slug);
  }

  async listPublicHub(now = new Date()): Promise<TalkPublicHub> {
    const rows = await this.db
      .select()
      .from(talks)
      .where(talkVisibleSql(now));

    const visible = rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      ),
    );

    const upcoming = visible
      .filter((row) => row.startsAt > now)
      .sort(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
      )
      .map((row) => this.toPublicCard(row));

    const past = visible
      .filter((row) => row.startsAt <= now)
      .sort((a, b) => {
        const byDate = b.startsAt.getTime() - a.startsAt.getTime();
        if (byDate !== 0) return byDate;
        return a.sortOrder - b.sortOrder;
      })
      .map((row) => this.toPublicCard(row));

    return { upcoming, past };
  }

  async listResourcesAdmin(talkId: string): Promise<TalkResourceRow[]> {
    await this.findByIdAdmin(talkId);
    return this.db
      .select()
      .from(talkResources)
      .where(eq(talkResources.talkId, talkId))
      .orderBy(asc(talkResources.sortOrder));
  }

  async listResourcesForPublic(talkId: string): Promise<TalkResourceRow[]> {
    return this.db
      .select()
      .from(talkResources)
      .where(eq(talkResources.talkId, talkId))
      .orderBy(asc(talkResources.sortOrder));
  }

  async replaceTalkResources(
    talkId: string,
    items: TalkResourceWrite[],
  ): Promise<TalkResourceRow[]> {
    await this.findByIdAdmin(talkId);
    const normalized = normalizeTalkResourceInputs(items);
    await this.db.transaction(async (tx) => {
      await tx.delete(talkResources).where(eq(talkResources.talkId, talkId));
      if (normalized.length > 0) {
        await tx.insert(talkResources).values(
          normalized.map((row) => ({
            talkId,
            sortOrder: row.sortOrder,
            resourceType: row.resourceType,
            label: row.label,
            url: row.url,
          })),
        );
      }
    });
    return this.listResourcesAdmin(talkId);
  }

  async getRelationsAdmin(talkId: string): Promise<TalkRelations> {
    await this.findByIdAdmin(talkId);
    const [pubs, projs, themes] = await Promise.all([
      this.db
        .select({ id: talkPublications.publicationId })
        .from(talkPublications)
        .where(eq(talkPublications.talkId, talkId))
        .orderBy(asc(talkPublications.sortOrder)),
      this.db
        .select({ id: talkProjects.projectId })
        .from(talkProjects)
        .where(eq(talkProjects.talkId, talkId))
        .orderBy(asc(talkProjects.sortOrder)),
      this.db
        .select({ id: talkResearchThemes.themeId })
        .from(talkResearchThemes)
        .where(eq(talkResearchThemes.talkId, talkId))
        .orderBy(asc(talkResearchThemes.sortOrder)),
    ]);
    return {
      publicationIds: pubs.map((r) => r.id),
      projectIds: projs.map((r) => r.id),
      themeIds: themes.map((r) => r.id),
    };
  }

  async replaceTalkRelations(
    talkId: string,
    body: ReplaceTalkRelationsInput,
  ): Promise<TalkRelations> {
    await this.findByIdAdmin(talkId);
    const publicationIds = dedupeIds(body.publicationIds ?? []);
    const projectIds = dedupeIds(body.projectIds ?? []);
    const themeIds = dedupeIds(body.themeIds ?? []);
    assertRelationIdLimits(publicationIds, projectIds, themeIds);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(talkPublications)
        .where(eq(talkPublications.talkId, talkId));
      await tx.delete(talkProjects).where(eq(talkProjects.talkId, talkId));
      await tx
        .delete(talkResearchThemes)
        .where(eq(talkResearchThemes.talkId, talkId));

      if (publicationIds.length > 0) {
        await tx.insert(talkPublications).values(
          publicationIds.map((publicationId, i) => ({
            talkId,
            publicationId,
            sortOrder: i,
          })),
        );
      }
      if (projectIds.length > 0) {
        await tx.insert(talkProjects).values(
          projectIds.map((projectId, i) => ({
            talkId,
            projectId,
            sortOrder: i,
          })),
        );
      }
      if (themeIds.length > 0) {
        await tx.insert(talkResearchThemes).values(
          themeIds.map((themeId, i) => ({
            talkId,
            themeId,
            sortOrder: i,
          })),
        );
      }
    });

    return this.getRelationsAdmin(talkId);
  }

  private async isSlugTakenByOther(
    slug: string,
    talkId: string,
  ): Promise<boolean> {
    const [other] = await this.db
      .select({ id: talks.id })
      .from(talks)
      .where(and(eq(talks.slug, slug), ne(talks.id, talkId)))
      .limit(1);
    return Boolean(other);
  }

  async getPublishChecklist(id: string) {
    const row = await this.findByIdAdmin(id);
    const resources = await this.listResourcesAdmin(id);
    const slugTaken = await this.isSlugTakenByOther(row.slug, id);
    return talkPublishChecklist(row, {
      resourceCount: resources.length,
      slugTaken,
    });
  }

  private async assertCanPublish(
    id: string,
    options: PublishTalkOptions = {},
  ): Promise<void> {
    const checklist = await this.getPublishChecklist(id);
    if (checklist.errors.length > 0) {
      throw new BadRequestException({
        message: checklist.errors.map((item) => item.message).join('; '),
        code: 'PUBLISH_BLOCKED',
        checklist,
      });
    }
    if (checklist.warnings.length > 0 && !options.confirmWarnings) {
      throw new BadRequestException({
        message: 'Confirm publish warnings before continuing',
        code: 'PUBLISH_WARNINGS',
        checklist,
      });
    }
  }

  async publish(id: string, options: PublishTalkOptions = {}): Promise<TalkRow> {
    await this.assertCanPublish(id, options);
    const now = new Date();
    const [updated] = await this.db
      .update(talks)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(talks.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Talk not found');
    }
    return updated;
  }

  async unpublish(id: string): Promise<TalkRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(talks)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
      .where(eq(talks.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Talk not found');
    }
    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    options: PublishTalkOptions = {},
  ): Promise<TalkRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    await this.assertCanPublish(id, options);
    const [updated] = await this.db
      .update(talks)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(talks.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Talk not found');
    }
    return updated;
  }

  async archive(id: string): Promise<TalkRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(talks)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(talks.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Talk not found');
    }
    return updated;
  }
}
