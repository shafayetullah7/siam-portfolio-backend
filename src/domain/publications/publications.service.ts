import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { publications } from '../../db/schema/publications';
import { researchThemePublications } from '../../db/schema/research';
import type {
  ListAdminPublicationsQuery,
  PublicationPublicCard,
  PublicationRow,
} from './publications.types';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

@Injectable()
export class PublicationsService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  hrefForSlug(slug: string): string {
    return `/publications/${slug}`;
  }

  toPublicCard(row: PublicationRow): PublicationPublicCard {
    return {
      slug: row.slug,
      title: row.title,
      authorsShort: row.authorsShort,
      year: row.year,
      venue: row.venue,
      ...(row.significance?.trim()
        ? { significance: row.significance.trim() }
        : {}),
      href: this.hrefForSlug(row.slug),
    };
  }

  async findByIdAdmin(id: string): Promise<PublicationRow> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(eq(publications.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Publication not found');
    }
    return row;
  }

  async listAdmin(
    query: ListAdminPublicationsQuery = {},
  ): Promise<PublicationRow[]> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const conditions: SQL[] = [];
    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(publications.title, pattern),
          ilike(publications.slug, pattern),
          ilike(publications.authorsShort, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(publications.publishStatus, query.publishStatus));
    }
    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(publications)
      .where(whereClause)
      .orderBy(asc(publications.title))
      .limit(limit);
  }

  async findManyByIds(ids: string[]): Promise<PublicationRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(publications)
      .where(inArray(publications.id, ids));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is PublicationRow => row != null);
  }

  async assertAllExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const rows = await this.db
      .select({ id: publications.id })
      .from(publications)
      .where(inArray(publications.id, ids));
    if (rows.length !== ids.length) {
      throw new BadRequestException('One or more publications not found');
    }
  }

  async listPublishedCardsByIds(
    ids: string[],
    now = new Date(),
  ): Promise<PublicationPublicCard[]> {
    const rows = await this.findManyByIds(ids);
    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .map((row) => this.toPublicCard(row));
  }

  async countPublishedForThemeIds(
    themeIds: string[],
    now = new Date(),
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (themeIds.length === 0) {
      return result;
    }

    const visibleCondition = or(
      eq(publications.publishStatus, 'published'),
      and(
        eq(publications.publishStatus, 'scheduled'),
        lte(publications.scheduledAt, now),
      ),
    );

    const rows = await this.db
      .select({
        themeId: researchThemePublications.themeId,
        count: count(),
      })
      .from(researchThemePublications)
      .innerJoin(
        publications,
        eq(researchThemePublications.publicationId, publications.id),
      )
      .where(
        and(inArray(researchThemePublications.themeId, themeIds), visibleCondition),
      )
      .groupBy(researchThemePublications.themeId);

    for (const row of rows) {
      result.set(row.themeId, Number(row.count));
    }
    return result;
  }
}
