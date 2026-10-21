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
import { projects } from '../../db/schema/projects';
import { researchThemeProjects } from '../../db/schema/research';
import type {
  ListAdminProjectsQuery,
  ProjectPublicCard,
  ProjectRow,
} from './projects.types';

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  hrefForSlug(slug: string): string {
    return `/projects/${slug}`;
  }

  toPublicCard(row: ProjectRow): ProjectPublicCard {
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      ...(row.tags && row.tags.length > 0 ? { tags: row.tags } : {}),
      href: this.hrefForSlug(row.slug),
    };
  }

  async findByIdAdmin(id: string): Promise<ProjectRow> {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    return row;
  }

  async listAdmin(query: ListAdminProjectsQuery = {}): Promise<ProjectRow[]> {
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
          ilike(projects.title, pattern),
          ilike(projects.slug, pattern),
          ilike(projects.summary, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(projects.publishStatus, query.publishStatus));
    }
    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(projects)
      .where(whereClause)
      .orderBy(asc(projects.title))
      .limit(limit);
  }

  async findManyByIds(ids: string[]): Promise<ProjectRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(projects)
      .where(inArray(projects.id, ids));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is ProjectRow => row != null);
  }

  async assertAllExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const rows = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.id, ids));
    if (rows.length !== ids.length) {
      throw new BadRequestException('One or more projects not found');
    }
  }

  async listPublishedCardsByIds(
    ids: string[],
    now = new Date(),
  ): Promise<ProjectPublicCard[]> {
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
      eq(projects.publishStatus, 'published'),
      and(
        eq(projects.publishStatus, 'scheduled'),
        lte(projects.scheduledAt, now),
      ),
    );

    const rows = await this.db
      .select({
        themeId: researchThemeProjects.themeId,
        count: count(),
      })
      .from(researchThemeProjects)
      .innerJoin(projects, eq(researchThemeProjects.projectId, projects.id))
      .where(and(inArray(researchThemeProjects.themeId, themeIds), visibleCondition))
      .groupBy(researchThemeProjects.themeId);

    for (const row of rows) {
      result.set(row.themeId, Number(row.count));
    }
    return result;
  }
}
