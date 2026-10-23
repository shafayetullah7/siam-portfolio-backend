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
  inArray,
  ne,
  or,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponse,
} from '../../common/pagination/paginated-response';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { projects } from '../../db/schema/projects';
import { publications } from '../../db/schema/publications';
import { timelineEntries } from '../../db/schema/timeline/timeline-entries';
import { timelineEntryMedia } from '../../db/schema/timeline/timeline-entry-media';
import { MediaService } from '../media/media.service';
import {
  assertValidTimelineKind,
  mergeDateFieldsForValidation,
  normalizeTimelineSlug,
  validateTimelineDateFields,
} from './timeline-entry.validation';
import {
  ACHIEVEMENT_KINDS,
  EXPERIENCE_KINDS,
  isAchievementKind,
  type TimelineEntryKind,
} from './timeline-kinds';
import type {
  CreateTimelineEntryInput,
  ListAdminTimelineQuery,
  ListAdminTimelineSort,
  ListPublishedByKindsOptions,
  ReplaceEntryMediaInput,
  TimelineEntryAdmin,
  TimelineEntryMediaAdmin,
  TimelineEntryRow,
  TimelinePublicCard,
  TimelinePublicDetail,
  TimelinePublicImage,
  UpdateTimelineEntryInput,
} from './timeline.types';

const MAX_ENTRY_MEDIA = 10;
const MAX_FEATURED_PUBLISHED_ACHIEVEMENTS = 3;
const DEFAULT_PUBLIC_LIST_LIMIT = 100;
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

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function dedupeMediaIds(items: ReplaceEntryMediaInput): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const item of items) {
    if (!seen.has(item.mediaId)) {
      seen.add(item.mediaId);
      ids.push(item.mediaId);
    }
  }
  return ids;
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly media: MediaService,
  ) {}

  hrefForSlug(slug: string): string {
    return `/achievements/${slug}`;
  }

  toPublicCard(
    row: TimelineEntryRow,
    images: TimelinePublicImage[],
    options?: { href?: string },
  ): TimelinePublicCard {
    const href =
      options?.href ??
      (row.slug ? this.hrefForSlug(row.slug) : undefined);
    return {
      id: row.id,
      kind: row.kind as TimelineEntryKind,
      title: row.title,
      subtitle: row.subtitle,
      organization: row.organization,
      location: row.location,
      startDate: row.startDate,
      endDate: row.endDate,
      isOngoing: row.isOngoing,
      featured: row.featured,
      images,
      ...(href ? { href } : {}),
    };
  }

  toPublicDetail(
    row: TimelineEntryRow,
    images: TimelinePublicImage[],
  ): TimelinePublicDetail {
    const card = this.toPublicCard(row, images);
    return {
      ...card,
      summary: row.summary,
      proofUrl: row.proofUrl,
      rankOrPlacement: row.rankOrPlacement,
      eventName: row.eventName,
      credentialId: row.credentialId,
      expiresAt: row.expiresAt,
      isCurrent: row.isCurrent,
      publicationId: row.publicationId,
      projectId: row.projectId,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishStatus: row.publishStatus as PublishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  }

  async findByIdAdmin(id: string): Promise<TimelineEntryAdmin> {
    const row = await this.findEntryRow(id);
    const mediaRows = await this.loadMediaRowsForEntry(id);
    return {
      ...row,
      media: mediaRows.map((m) => ({
        id: m.id,
        mediaId: m.mediaId,
        sortOrder: m.sortOrder,
        caption: m.caption,
        imageRole: m.imageRole,
      })),
    };
  }

  private orderByForAdminList(sort: ListAdminTimelineSort = 'updatedAtDesc') {
    switch (sort) {
      case 'startDateDesc':
        return [desc(timelineEntries.startDate), asc(timelineEntries.title)];
      case 'titleAsc':
        return [asc(timelineEntries.title)];
      case 'updatedAtDesc':
      default:
        return [desc(timelineEntries.updatedAt), asc(timelineEntries.title)];
    }
  }

  private resolveEffectiveKinds(
    query: ListAdminTimelineQuery,
  ): TimelineEntryKind[] | undefined {
    if (query.kinds && query.kinds.length > 0) {
      return [...query.kinds];
    }
    if (query.kind) {
      return [query.kind];
    }
    return undefined;
  }

  async listAdmin(
    query: ListAdminTimelineQuery = {},
  ): Promise<PaginatedResponse<TimelineEntryRow>> {
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
          ilike(timelineEntries.title, pattern),
          ilike(timelineEntries.organization, pattern),
          ilike(timelineEntries.slug, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(timelineEntries.publishStatus, query.publishStatus));
    }
    const effectiveKinds = this.resolveEffectiveKinds(query);
    if (effectiveKinds) {
      conditions.push(inArray(timelineEntries.kind, effectiveKinds));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(timelineEntries)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(timelineEntries)
      .where(whereClause)
      .orderBy(...this.orderByForAdminList(query.sort))
      .limit(limit)
      .offset(offset);

    const total = Number(countRow?.total ?? 0);
    return buildPaginatedResponse(items, { page, limit, total });
  }

  async create(input: CreateTimelineEntryInput): Promise<TimelineEntryRow> {
    const kind = assertValidTimelineKind(input.kind);
    validateTimelineDateFields({
      startDate: input.startDate,
      endDate: input.endDate,
      isOngoing: input.isOngoing,
    });
    const slug = normalizeTimelineSlug(input.slug);
    if (slug) {
      await this.assertSlugAvailable(slug);
    }
    if (input.featured && isAchievementKind(kind)) {
      await this.assertFeaturedPublishedQuota(undefined, true);
    }
    await this.assertOptionalForeignKeys(input);

    try {
      const [row] = await this.db
        .insert(timelineEntries)
        .values(this.valuesFromCreate(input, kind, slug))
        .returning();
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateTimelineEntryInput,
  ): Promise<TimelineEntryRow> {
    const existing = await this.findEntryRow(id);
    const kind =
      input.kind !== undefined
        ? assertValidTimelineKind(input.kind)
        : (existing.kind as TimelineEntryKind);

    const mergedDates = mergeDateFieldsForValidation(
      {
        startDate: existing.startDate,
        endDate: existing.endDate,
        isOngoing: existing.isOngoing,
      },
      {
        startDate: input.startDate,
        endDate: input.endDate,
        isOngoing: input.isOngoing,
      },
    );
    validateTimelineDateFields(mergedDates);

    let slug = existing.slug;
    if (input.slug !== undefined) {
      slug = normalizeTimelineSlug(input.slug);
      if (slug) {
        await this.assertSlugAvailable(slug, id);
      }
    }

    if (input.featured === true && isAchievementKind(kind)) {
      await this.assertFeaturedPublishedQuota(id, true);
    }

    await this.assertOptionalForeignKeys(input);

    const patch = this.buildUpdatePatch(input, kind, slug);
    if (Object.keys(patch).length === 0) {
      return existing;
    }

    try {
      const [row] = await this.db
        .update(timelineEntries)
        .set(patch)
        .where(eq(timelineEntries.id, id))
        .returning();
      if (!row) {
        throw new NotFoundException('Timeline entry not found');
      }
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async replaceEntryMedia(
    entryId: string,
    items: ReplaceEntryMediaInput,
  ): Promise<TimelineEntryMediaAdmin[]> {
    await this.findEntryRow(entryId);
    if (items.length > MAX_ENTRY_MEDIA) {
      throw new BadRequestException(
        `At most ${MAX_ENTRY_MEDIA} images allowed per entry`,
      );
    }
    const mediaIds = dedupeMediaIds(items);
    if (mediaIds.length !== items.length) {
      throw new BadRequestException('Duplicate mediaId in gallery');
    }
    for (const mediaId of mediaIds) {
      try {
        await this.media.findById(mediaId);
      } catch {
        throw new BadRequestException(`Media not found: ${mediaId}`);
      }
    }

    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(timelineEntryMedia)
        .where(eq(timelineEntryMedia.timelineEntryId, entryId));
      if (sorted.length > 0) {
        await tx.insert(timelineEntryMedia).values(
          sorted.map((item) => ({
            timelineEntryId: entryId,
            mediaId: item.mediaId,
            sortOrder: item.sortOrder,
            caption: trimOptional(item.caption ?? undefined),
            imageRole: item.imageRole ?? null,
          })),
        );
      }
    });

    const rows = await this.loadMediaRowsForEntry(entryId);
    return rows.map((m) => ({
      id: m.id,
      mediaId: m.mediaId,
      sortOrder: m.sortOrder,
      caption: m.caption,
      imageRole: m.imageRole,
    }));
  }

  async findPublishedBySlug(
    slug: string,
    now = new Date(),
  ): Promise<TimelinePublicDetail | null> {
    const [row] = await this.db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.slug, slug))
      .limit(1);
    if (!row) {
      return null;
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      )
    ) {
      return null;
    }
    const images = await this.resolvePublicImages(row.id);
    return this.toPublicDetail(row, images);
  }

  async listPublishedByKinds(
    kinds: readonly TimelineEntryKind[],
    options: ListPublishedByKindsOptions = {},
  ): Promise<TimelinePublicCard[]> {
    const now = options.now ?? new Date();
    const limit = Math.min(
      options.limit ?? DEFAULT_PUBLIC_LIST_LIMIT,
      DEFAULT_PUBLIC_LIST_LIMIT,
    );

    const rows = await this.db
      .select()
      .from(timelineEntries)
      .where(inArray(timelineEntries.kind, [...kinds]))
      .orderBy(
        asc(timelineEntries.sortOrder),
        desc(timelineEntries.startDate),
        asc(timelineEntries.title),
      );

    const visible = rows.filter((row) => {
      if (
        !isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        )
      ) {
        return false;
      }
      if (options.featuredOnly && !row.featured) {
        return false;
      }
      return true;
    });

    const limited = visible.slice(0, limit);
    const mediaByEntry = await this.loadMediaByEntryIds(
      limited.map((r) => r.id),
    );

    return limited.map((row) => {
      const images = mediaByEntry.get(row.id) ?? [];
      return this.toPublicCard(row, images);
    });
  }

  async listPublishedAchievements(
    options?: ListPublishedByKindsOptions,
  ): Promise<TimelinePublicCard[]> {
    return this.listPublishedByKinds(ACHIEVEMENT_KINDS, options);
  }

  async listPublishedExperience(
    options?: ListPublishedByKindsOptions,
  ): Promise<TimelinePublicCard[]> {
    return this.listPublishedByKinds(EXPERIENCE_KINDS, options);
  }

  async countFeaturedPublishedAchievements(
    excludeEntryId?: string,
  ): Promise<number> {
    const conditions = [
      eq(timelineEntries.featured, true),
      eq(timelineEntries.publishStatus, 'published'),
      inArray(timelineEntries.kind, [...ACHIEVEMENT_KINDS]),
    ];
    if (excludeEntryId) {
      conditions.push(ne(timelineEntries.id, excludeEntryId));
    }
    const rows = await this.db
      .select({ id: timelineEntries.id })
      .from(timelineEntries)
      .where(and(...conditions));
    return rows.length;
  }

  async assertFeaturedPublishedQuota(
    excludeEntryId: string | undefined,
    enabling: boolean,
  ): Promise<void> {
    if (!enabling) return;
    const count = await this.countFeaturedPublishedAchievements(excludeEntryId);
    if (count >= MAX_FEATURED_PUBLISHED_ACHIEVEMENTS) {
      throw new BadRequestException(
        `At most ${MAX_FEATURED_PUBLISHED_ACHIEVEMENTS} published achievements can be featured on the overview`,
      );
    }
  }

  async resolvePublicImages(entryId: string): Promise<TimelinePublicImage[]> {
    const byEntry = await this.loadMediaByEntryIds([entryId]);
    return byEntry.get(entryId) ?? [];
  }

  private async loadMediaByEntryIds(
    entryIds: string[],
  ): Promise<Map<string, TimelinePublicImage[]>> {
    const result = new Map<string, TimelinePublicImage[]>();
    if (entryIds.length === 0) {
      return result;
    }
    for (const id of entryIds) {
      result.set(id, []);
    }

    const junctionRows = await this.db
      .select()
      .from(timelineEntryMedia)
      .where(inArray(timelineEntryMedia.timelineEntryId, entryIds))
      .orderBy(asc(timelineEntryMedia.sortOrder));

    const mediaIds = [...new Set(junctionRows.map((r) => r.mediaId))];
    const mediaMap = await this.loadMediaUrlMap(mediaIds);

    for (const junction of junctionRows) {
      const mediaRow = mediaMap.get(junction.mediaId);
      if (!mediaRow) {
        continue;
      }
      const images = result.get(junction.timelineEntryId) ?? [];
      images.push({
        url: mediaRow.url,
        alt: mediaRow.alt ?? '',
        caption: junction.caption,
        sortOrder: junction.sortOrder,
        imageRole: junction.imageRole,
      });
      result.set(junction.timelineEntryId, images);
    }

    return result;
  }

  private async loadMediaUrlMap(
    mediaIds: string[],
  ): Promise<Map<string, { url: string; alt: string | null }>> {
    const map = new Map<string, { url: string; alt: string | null }>();
    for (const id of mediaIds) {
      try {
        const row = await this.media.findById(id);
        map.set(id, { url: row.url, alt: row.alt });
      } catch {
        // omit missing media
      }
    }
    return map;
  }

  private async loadMediaRowsForEntry(
    entryId: string,
  ): Promise<(typeof timelineEntryMedia.$inferSelect)[]> {
    return this.db
      .select()
      .from(timelineEntryMedia)
      .where(eq(timelineEntryMedia.timelineEntryId, entryId))
      .orderBy(asc(timelineEntryMedia.sortOrder));
  }

  private async findEntryRow(id: string): Promise<TimelineEntryRow> {
    const [row] = await this.db
      .select()
      .from(timelineEntries)
      .where(eq(timelineEntries.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Timeline entry not found');
    }
    return row;
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const conditions = [eq(timelineEntries.slug, slug)];
    if (excludeId) {
      conditions.push(ne(timelineEntries.id, excludeId));
    }
    const [existing] = await this.db
      .select({ id: timelineEntries.id })
      .from(timelineEntries)
      .where(and(...conditions))
      .limit(1);
    if (existing) {
      throw new ConflictException('Slug already exists');
    }
  }

  private async assertOptionalForeignKeys(
    input: CreateTimelineEntryInput | UpdateTimelineEntryInput,
  ): Promise<void> {
    if (input.publicationId) {
      const [row] = await this.db
        .select({ id: publications.id })
        .from(publications)
        .where(eq(publications.id, input.publicationId))
        .limit(1);
      if (!row) {
        throw new BadRequestException('Publication not found');
      }
    }
    if (input.projectId) {
      const [row] = await this.db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);
      if (!row) {
        throw new BadRequestException('Project not found');
      }
    }
  }

  private valuesFromCreate(
    input: CreateTimelineEntryInput,
    kind: TimelineEntryKind,
    slug: string | null,
  ): typeof timelineEntries.$inferInsert {
    return {
      kind,
      slug,
      title: input.title.trim(),
      subtitle: trimOptional(input.subtitle),
      summary: trimOptional(input.summary),
      organization: trimOptional(input.organization),
      location: trimOptional(input.location),
      startDate: trimOptional(input.startDate ?? undefined),
      endDate: trimOptional(input.endDate ?? undefined),
      isOngoing: input.isOngoing ?? false,
      isCurrent: input.isCurrent ?? null,
      proofUrl: trimOptional(input.proofUrl),
      rankOrPlacement: trimOptional(input.rankOrPlacement),
      eventName: trimOptional(input.eventName),
      credentialId: trimOptional(input.credentialId),
      expiresAt: trimOptional(input.expiresAt ?? undefined),
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      publicationId: input.publicationId ?? null,
      projectId: input.projectId ?? null,
      seoTitle: trimOptional(input.seoTitle),
      seoDescription: trimOptional(input.seoDescription),
      hideFromSearch: input.hideFromSearch ?? false,
      metadata: input.metadata ?? null,
      publishStatus: 'draft',
    };
  }

  private buildUpdatePatch(
    input: UpdateTimelineEntryInput,
    kind: TimelineEntryKind,
    slug: string | null,
  ): Partial<typeof timelineEntries.$inferInsert> {
    const patch: Partial<typeof timelineEntries.$inferInsert> = {};
    if (input.kind !== undefined) patch.kind = kind;
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.slug !== undefined) patch.slug = slug;
    if (input.subtitle !== undefined) {
      patch.subtitle = trimOptional(input.subtitle);
    }
    if (input.summary !== undefined) {
      patch.summary = trimOptional(input.summary);
    }
    if (input.organization !== undefined) {
      patch.organization = trimOptional(input.organization);
    }
    if (input.location !== undefined) {
      patch.location = trimOptional(input.location);
    }
    if (input.startDate !== undefined) {
      patch.startDate = trimOptional(input.startDate ?? undefined);
    }
    if (input.endDate !== undefined) {
      patch.endDate = trimOptional(input.endDate ?? undefined);
    }
    if (input.isOngoing !== undefined) patch.isOngoing = input.isOngoing;
    if (input.isCurrent !== undefined) patch.isCurrent = input.isCurrent;
    if (input.proofUrl !== undefined) {
      patch.proofUrl = trimOptional(input.proofUrl);
    }
    if (input.rankOrPlacement !== undefined) {
      patch.rankOrPlacement = trimOptional(input.rankOrPlacement);
    }
    if (input.eventName !== undefined) {
      patch.eventName = trimOptional(input.eventName);
    }
    if (input.credentialId !== undefined) {
      patch.credentialId = trimOptional(input.credentialId);
    }
    if (input.expiresAt !== undefined) {
      patch.expiresAt = trimOptional(input.expiresAt ?? undefined);
    }
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.publicationId !== undefined) {
      patch.publicationId = input.publicationId;
    }
    if (input.projectId !== undefined) patch.projectId = input.projectId;
    if (input.seoTitle !== undefined) {
      patch.seoTitle = trimOptional(input.seoTitle);
    }
    if (input.seoDescription !== undefined) {
      patch.seoDescription = trimOptional(input.seoDescription);
    }
    if (input.hideFromSearch !== undefined) {
      patch.hideFromSearch = input.hideFromSearch;
    }
    if (input.metadata !== undefined) patch.metadata = input.metadata;
    return patch;
  }
}
