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
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import {
  buildPaginatedResponse,
  type PaginatedResponse,
} from '../../common/pagination/paginated-response';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { articles } from '../../db/schema/writing/articles';
import { writingSeries } from '../../db/schema/writing/writing-series';
import { recomputeReadingStats } from './writing-reading-stats';
import type {
  ArticleRow,
  CreateArticleInput,
  ListAdminArticlesQuery,
  ListAdminArticlesSort,
  UpdateArticleInput,
  WritingPublicCard,
  WritingPublicDetail,
} from './writing.types';

const MAX_FEATURED_ON_HUB = 1;
const DEFAULT_ADMIN_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

@Injectable()
export class WritingService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  hrefForSlug(slug: string): string {
    return `/writing/${slug}`;
  }

  assertPublishable(row: ArticleRow): void {
    if (!row.title?.trim()) {
      throw new BadRequestException('Title is required');
    }
    if (!row.slug?.trim()) {
      throw new BadRequestException('Slug is required');
    }
    if (!row.summary?.trim()) {
      throw new BadRequestException('Summary is required');
    }
    if (!row.body?.trim()) {
      throw new BadRequestException('Body is required');
    }
  }

  toPublicCard(row: ArticleRow): WritingPublicCard {
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      href: this.hrefForSlug(row.slug),
      ...(row.tags && row.tags.length > 0 ? { tags: row.tags } : {}),
      ...(row.readingTimeMinutes != null
        ? { readingTimeMinutes: row.readingTimeMinutes }
        : {}),
      ...(row.publishedAt
        ? { publishedAt: row.publishedAt.toISOString() }
        : {}),
      updatedAt: row.updatedAt.toISOString(),
      ...(row.materiallyUpdatedAt
        ? { materiallyUpdatedAt: row.materiallyUpdatedAt.toISOString() }
        : {}),
      ...(row.featuredOnHub ? { featuredOnHub: true } : {}),
    };
  }

  toPublicDetail(row: ArticleRow): WritingPublicDetail {
    return {
      ...this.toPublicCard(row),
      ...(row.subtitle ? { subtitle: row.subtitle } : {}),
      body: row.body,
      ...(row.byline ? { byline: row.byline } : {}),
    };
  }

  async countFeaturedOnHub(excludeArticleId?: string): Promise<number> {
    const conditions = [eq(articles.featuredOnHub, true)];
    if (excludeArticleId) {
      conditions.push(ne(articles.id, excludeArticleId));
    }
    const rows = await this.db
      .select({ id: articles.id })
      .from(articles)
      .where(and(...conditions));
    return rows.length;
  }

  async assertFeaturedOnHubQuota(
    excludeArticleId: string | undefined,
    enabling: boolean,
  ): Promise<void> {
    if (!enabling) return;
    const count = await this.countFeaturedOnHub(excludeArticleId);
    if (count >= MAX_FEATURED_ON_HUB) {
      throw new BadRequestException(
        `At most ${MAX_FEATURED_ON_HUB} article can be featured on the writing hub`,
      );
    }
  }

  private valuesFromCreate(input: CreateArticleInput) {
    const body = input.body ?? '';
    const stats = recomputeReadingStats(body);
    const tags = input.tags ? [...input.tags] : null;
    return {
      slug: input.slug.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      body,
      ...(input.subtitle !== undefined
        ? { subtitle: trimOptional(input.subtitle) }
        : {}),
      tags,
      ...(input.seriesId !== undefined ? { seriesId: input.seriesId } : {}),
      ...(input.seriesSortOrder !== undefined
        ? { seriesSortOrder: input.seriesSortOrder }
        : {}),
      ...(input.coverMediaId !== undefined
        ? { coverMediaId: input.coverMediaId }
        : {}),
      ...(input.byline !== undefined
        ? { byline: trimOptional(input.byline) }
        : {}),
      wordCount: stats.wordCount,
      readingTimeMinutes: stats.readingTimeMinutes,
      featuredOnHub: input.featuredOnHub ?? false,
      featured: input.featured ?? false,
      sortOrder: input.sortOrder ?? 0,
      ...(input.seoTitle !== undefined
        ? { seoTitle: trimOptional(input.seoTitle) }
        : {}),
      ...(input.seoDescription !== undefined
        ? { seoDescription: trimOptional(input.seoDescription) }
        : {}),
      hideFromSearch: input.hideFromSearch ?? false,
      publishStatus: 'draft' as const,
    };
  }

  private async assertSeriesExists(seriesId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: writingSeries.id })
      .from(writingSeries)
      .where(eq(writingSeries.id, seriesId))
      .limit(1);
    if (!row) {
      throw new BadRequestException('Series not found');
    }
  }

  private orderByForAdminList(sort: ListAdminArticlesSort = 'updatedAtDesc') {
    switch (sort) {
      case 'titleAsc':
        return [asc(articles.title)];
      case 'publishedAtDesc':
        return [desc(articles.publishedAt), asc(articles.title)];
      case 'updatedAtDesc':
      default:
        return [desc(articles.updatedAt), asc(articles.title)];
    }
  }

  async listAdmin(
    query: ListAdminArticlesQuery = {},
  ): Promise<PaginatedResponse<ArticleRow>> {
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
          ilike(articles.title, pattern),
          ilike(articles.slug, pattern),
          ilike(articles.summary, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(articles.publishStatus, query.publishStatus));
    }
    const tag = query.tag?.trim();
    if (tag) {
      conditions.push(sql`${articles.tags} @> ARRAY[${tag}]::text[]`);
    }
    if (query.seriesId) {
      conditions.push(eq(articles.seriesId, query.seriesId));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(articles)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(articles)
      .where(whereClause)
      .orderBy(...this.orderByForAdminList(query.sort))
      .limit(limit)
      .offset(offset);

    const total = Number(countRow?.total ?? 0);
    return buildPaginatedResponse(items, { page, limit, total });
  }

  async create(input: CreateArticleInput): Promise<ArticleRow> {
    if (input.featuredOnHub) {
      await this.assertFeaturedOnHubQuota(undefined, true);
    }
    if (input.seriesId) {
      await this.assertSeriesExists(input.seriesId);
    }
    try {
      const [row] = await this.db
        .insert(articles)
        .values(this.valuesFromCreate(input))
        .returning();
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateArticleInput): Promise<ArticleRow> {
    await this.findByIdAdmin(id);
    if (input.featuredOnHub === true) {
      await this.assertFeaturedOnHubQuota(id, true);
    }
    if (input.seriesId) {
      await this.assertSeriesExists(input.seriesId);
    }

    const patch: Record<string, unknown> = {};
    if (input.slug !== undefined) patch.slug = input.slug.trim();
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.subtitle !== undefined) {
      patch.subtitle = trimOptional(input.subtitle);
    }
    if (input.body !== undefined) {
      patch.body = input.body;
      const stats = recomputeReadingStats(input.body);
      patch.wordCount = stats.wordCount;
      patch.readingTimeMinutes = stats.readingTimeMinutes;
    }
    if (input.tags !== undefined) {
      patch.tags = input.tags ? [...input.tags] : null;
    }
    if (input.seriesId !== undefined) patch.seriesId = input.seriesId;
    if (input.seriesSortOrder !== undefined) {
      patch.seriesSortOrder = input.seriesSortOrder;
    }
    if (input.coverMediaId !== undefined) {
      patch.coverMediaId = input.coverMediaId;
    }
    if (input.byline !== undefined) {
      patch.byline = trimOptional(input.byline);
    }
    if (input.featuredOnHub !== undefined) {
      patch.featuredOnHub = input.featuredOnHub;
    }
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.seoTitle !== undefined) {
      patch.seoTitle = trimOptional(input.seoTitle);
    }
    if (input.seoDescription !== undefined) {
      patch.seoDescription = trimOptional(input.seoDescription);
    }
    if (input.hideFromSearch !== undefined) {
      patch.hideFromSearch = input.hideFromSearch;
    }

    if (Object.keys(patch).length === 0) {
      return await this.findByIdAdmin(id);
    }

    try {
      const [row] = await this.db
        .update(articles)
        .set(patch)
        .where(eq(articles.id, id))
        .returning();
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      throw error;
    }
  }

  async findByIdAdmin(id: string): Promise<ArticleRow> {
    const [row] = await this.db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Article not found');
    }
    return row;
  }

  async findPublishedBySlug(slug: string, now = new Date()): Promise<ArticleRow> {
    const [row] = await this.db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Article not found');
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      )
    ) {
      throw new NotFoundException('Article not found');
    }
    return row;
  }

  async listPublished(now = new Date()): Promise<ArticleRow[]> {
    const rows = await this.db
      .select()
      .from(articles)
      .orderBy(desc(articles.publishedAt), asc(articles.title));

    return rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      ),
    );
  }

  async listPublishedSlugs(now = new Date()): Promise<string[]> {
    const rows = await this.listPublished(now);
    return rows.map((row) => row.slug);
  }
}
