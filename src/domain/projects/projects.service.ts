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
  eq,
  ilike,
  inArray,
  lte,
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
import { media } from '../../db/schema/media';
import { projectMetrics } from '../../db/schema/project-metrics';
import { projectPublications } from '../../db/schema/project-publications';
import { projectResources } from '../../db/schema/project-resources';
import { projectSectionMedia } from '../../db/schema/project-section-media';
import { projectSections } from '../../db/schema/project-sections';
import { projects } from '../../db/schema/projects';
import { researchThemeProjects } from '../../db/schema/research';
import {
  mapMetricsToAdmin,
  mapResourcesToAdmin,
  mapSectionsToAdmin,
  normalizeMetricInputs,
  normalizeResourceInputs,
  normalizeSectionInputs,
  type NormalizedProjectMetric,
  type NormalizedProjectResource,
  type NormalizedProjectSection,
} from './project-child-inputs';
import { MediaService } from '../media/media.service';
import { PublicationsService } from '../publications/publications.service';
import { projectPublishChecklist } from './project-publish-checklist';
import { assertPublishable as assertPublishableRules } from './project-publish.rules';
import type {
  CreateProjectInput,
  ListAdminProjectsQuery,
  ListPublishedPublicProjectsQuery,
  ProjectMetricRow,
  ProjectPublicCard,
  ProjectPublicDetail,
  ProjectPublicMetric,
  ProjectPublicResource,
  ProjectPublicSection,
  ProjectResourceRow,
  ProjectResourceType,
  ProjectRow,
  ProjectSectionRow,
  PublishProjectOptions,
  UpdateProjectInput,
} from './projects.types';

const DEFAULT_LIST_LIMIT = 50;
const DEFAULT_PUBLIC_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;
const MAX_FEATURED_ON_HOME = 3;
const MAX_PROJECT_PUBLICATIONS = 20;

function projectVisibleSql(now: Date): SQL {
  return or(
    eq(projects.publishStatus, 'published'),
    and(
      eq(projects.publishStatus, 'scheduled'),
      lte(projects.scheduledAt, now),
    ),
  )!;
}

const PRIMARY_RESOURCE_TYPES: ProjectResourceType[] = ['repo', 'demo'];

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

function pickPrimaryResource(
  resources: ProjectResourceRow[],
): ProjectPublicCard['primaryResource'] {
  const sorted = [...resources].sort((a, b) => a.sortOrder - b.sortOrder);
  const match = sorted.find((r) =>
    PRIMARY_RESOURCE_TYPES.includes(r.resourceType as ProjectResourceType),
  );
  if (!match) return undefined;
  return {
    label: match.label,
    url: match.url,
    resourceType: match.resourceType as ProjectResourceType,
  };
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly media: MediaService,
    private readonly publications: PublicationsService,
  ) {}

  hrefForSlug(slug: string): string {
    return `/projects/${slug}`;
  }

  private async resolveCoverMediaId(
    coverMediaId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (coverMediaId === undefined) return undefined;
    if (coverMediaId === null) return null;
    await this.media.assertImageMediaId(coverMediaId);
    return coverMediaId;
  }

  assertPublishable(row: ProjectRow): void {
    assertPublishableRules(row);
  }

  toPublicCard(
    row: ProjectRow,
    resources?: ProjectResourceRow[],
  ): ProjectPublicCard {
    const primary =
      resources != null ? pickPrimaryResource(resources) : undefined;
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      ...(row.tags && row.tags.length > 0 ? { tags: row.tags } : {}),
      href: this.hrefForSlug(row.slug),
      projectType: row.projectType,
      projectStatus: row.projectStatus,
      ...(trimOptional(row.ownerContribution)
        ? { ownerContribution: row.ownerContribution!.trim() }
        : {}),
      ...(trimOptional(row.resultTeaser)
        ? { resultTeaser: row.resultTeaser!.trim() }
        : {}),
      ...(row.featured ? { featured: true } : {}),
      ...(primary ? { primaryResource: primary } : {}),
    };
  }

  toPublicDetail(
    row: ProjectRow,
    sectionRows: ProjectSectionRow[],
    resourceRows: ProjectResourceRow[],
    metricRows: ProjectMetricRow[],
  ): ProjectPublicDetail {
    const sections: ProjectPublicSection[] = sectionRows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        kind: s.kind,
        ...(s.title ? { title: s.title } : {}),
        body: s.body,
        sortOrder: s.sortOrder,
      }));

    const resources: ProjectPublicResource[] = resourceRows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({
        resourceType: r.resourceType as ProjectResourceType,
        label: r.label,
        url: r.url,
        sortOrder: r.sortOrder,
      }));

    const metrics: ProjectPublicMetric[] = metricRows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((m) => ({
        name: m.name,
        value: m.value,
        ...(m.unit ? { unit: m.unit } : {}),
        ...(m.baseline ? { baseline: m.baseline } : {}),
        ...(m.notes ? { notes: m.notes } : {}),
        ...(m.caption ? { caption: m.caption } : {}),
        sortOrder: m.sortOrder,
      }));

    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      href: this.hrefForSlug(row.slug),
      ...(row.tags && row.tags.length > 0 ? { tags: row.tags } : {}),
      projectType: row.projectType,
      projectStatus: row.projectStatus,
      evaluationMaturity: row.evaluationMaturity,
      ...(trimOptional(row.ownerRole) ? { ownerRole: row.ownerRole!.trim() } : {}),
      ...(trimOptional(row.ownerContribution)
        ? { ownerContribution: row.ownerContribution!.trim() }
        : {}),
      ...(trimOptional(row.resultTeaser)
        ? { resultTeaser: row.resultTeaser!.trim() }
        : {}),
      ...(row.periodStart ? { periodStart: row.periodStart } : {}),
      ...(row.periodEnd ? { periodEnd: row.periodEnd } : {}),
      featured: row.featured,
      ...(trimOptional(row.seoTitle) ? { seoTitle: row.seoTitle!.trim() } : {}),
      ...(trimOptional(row.seoDescription)
        ? { seoDescription: row.seoDescription!.trim() }
        : {}),
      sections,
      resources,
      metrics,
    };
  }

  mapSectionsToAdmin(
    rows: ProjectSectionRow[],
    mediaBySectionId?: Map<string, string[]>,
  ) {
    return mapSectionsToAdmin(rows, mediaBySectionId);
  }

  mapResourcesToAdmin(rows: ProjectResourceRow[]) {
    return mapResourcesToAdmin(rows);
  }

  mapMetricsToAdmin(rows: ProjectMetricRow[]) {
    return mapMetricsToAdmin(rows);
  }

  private overviewValuesFromCreate(
    input: CreateProjectInput,
  ): typeof projects.$inferInsert {
    return {
      slug: input.slug.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      tags: input.tags ?? null,
      projectType: input.projectType ?? 'other',
      projectStatus: input.projectStatus ?? 'completed',
      evaluationMaturity: input.evaluationMaturity ?? 'provisional',
      ownerRole: trimOptional(input.ownerRole),
      ownerContribution: trimOptional(input.ownerContribution),
      resultTeaser: trimOptional(input.resultTeaser),
      periodStart: trimOptional(input.periodStart ?? undefined),
      periodEnd: trimOptional(input.periodEnd ?? undefined),
      coverMediaId: input.coverMediaId ?? null,
      featured: input.featured ?? false,
      featuredOnHome: input.featuredOnHome ?? false,
      sortOrder: input.sortOrder ?? 0,
      seoTitle: trimOptional(input.seoTitle),
      seoDescription: trimOptional(input.seoDescription),
      hideFromSearch: input.hideFromSearch ?? false,
      publishStatus: 'draft',
    };
  }

  private buildOverviewPatch(
    input: UpdateProjectInput,
  ): Partial<typeof projects.$inferInsert> {
    const patch: Partial<typeof projects.$inferInsert> = {};
    if (input.slug !== undefined) patch.slug = input.slug.trim();
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.projectType !== undefined) patch.projectType = input.projectType;
    if (input.projectStatus !== undefined) {
      patch.projectStatus = input.projectStatus;
    }
    if (input.evaluationMaturity !== undefined) {
      patch.evaluationMaturity = input.evaluationMaturity;
    }
    if (input.ownerRole !== undefined) {
      patch.ownerRole = trimOptional(input.ownerRole);
    }
    if (input.ownerContribution !== undefined) {
      patch.ownerContribution = trimOptional(input.ownerContribution);
    }
    if (input.resultTeaser !== undefined) {
      patch.resultTeaser = trimOptional(input.resultTeaser);
    }
    if (input.periodStart !== undefined) {
      patch.periodStart = trimOptional(input.periodStart);
    }
    if (input.periodEnd !== undefined) {
      patch.periodEnd = trimOptional(input.periodEnd);
    }
    if (input.coverMediaId !== undefined) {
      patch.coverMediaId = input.coverMediaId;
    }
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.featuredOnHome !== undefined) {
      patch.featuredOnHome = input.featuredOnHome;
    }
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
    return patch;
  }

  private async assertSectionFigureMediaIds(
    rows: NormalizedProjectSection[],
  ): Promise<void> {
    for (const row of rows) {
      for (const mediaId of row.mediaIds) {
        await this.media.assertImageMediaId(mediaId);
      }
    }
  }

  private async replaceSections(
    tx: Pick<NodePgDatabase, 'delete' | 'insert'>,
    projectId: string,
    rows: NormalizedProjectSection[],
  ): Promise<void> {
    await tx
      .delete(projectSections)
      .where(eq(projectSections.projectId, projectId));
    if (rows.length > 0) {
      const inserted = await tx
        .insert(projectSections)
        .values(
          rows.map((row) => ({
            projectId,
            sortOrder: row.sortOrder,
            kind: row.kind,
            title: row.title,
            body: row.body,
          })),
        )
        .returning();
      const mediaValues: {
        sectionId: string;
        mediaId: string;
        sortOrder: number;
      }[] = [];
      for (let i = 0; i < inserted.length; i++) {
        const mediaIds = rows[i]?.mediaIds ?? [];
        for (let j = 0; j < mediaIds.length; j++) {
          mediaValues.push({
            sectionId: inserted[i].id,
            mediaId: mediaIds[j],
            sortOrder: j,
          });
        }
      }
      if (mediaValues.length > 0) {
        await tx.insert(projectSectionMedia).values(mediaValues);
      }
    }
  }

  private async replaceResources(
    tx: Pick<NodePgDatabase, 'delete' | 'insert'>,
    projectId: string,
    rows: NormalizedProjectResource[],
  ): Promise<void> {
    await tx
      .delete(projectResources)
      .where(eq(projectResources.projectId, projectId));
    if (rows.length > 0) {
      await tx.insert(projectResources).values(
        rows.map((row) => ({
          projectId,
          sortOrder: row.sortOrder,
          resourceType: row.resourceType,
          label: row.label,
          url: row.url,
        })),
      );
    }
  }

  private async replaceMetrics(
    tx: Pick<NodePgDatabase, 'delete' | 'insert'>,
    projectId: string,
    rows: NormalizedProjectMetric[],
  ): Promise<void> {
    await tx.delete(projectMetrics).where(eq(projectMetrics.projectId, projectId));
    if (rows.length > 0) {
      await tx.insert(projectMetrics).values(
        rows.map((row) => ({
          projectId,
          sortOrder: row.sortOrder,
          name: row.name,
          value: row.value,
          unit: row.unit,
          baseline: row.baseline,
          notes: row.notes,
          caption: row.caption,
        })),
      );
    }
  }

  async create(input: CreateProjectInput): Promise<ProjectRow> {
    if (input.featuredOnHome) {
      await this.assertFeaturedOnHomeQuota(undefined, true);
    }
    const resolvedCover = await this.resolveCoverMediaId(input.coverMediaId);
    const createInput =
      resolvedCover !== undefined
        ? { ...input, coverMediaId: resolvedCover }
        : input;
    const sectionRows =
      input.sections !== undefined
        ? normalizeSectionInputs(input.sections)
        : undefined;
    if (sectionRows !== undefined) {
      await this.assertSectionFigureMediaIds(sectionRows);
    }
    const resourceRows =
      input.resources !== undefined
        ? normalizeResourceInputs(input.resources)
        : undefined;
    const metricRows =
      input.metrics !== undefined
        ? normalizeMetricInputs(input.metrics)
        : undefined;

    try {
      return await this.db.transaction(async (tx) => {
        const [row] = await tx
          .insert(projects)
          .values(this.overviewValuesFromCreate(createInput))
          .returning();
        if (sectionRows !== undefined) {
          await this.replaceSections(tx, row.id, sectionRows);
        }
        if (resourceRows !== undefined) {
          await this.replaceResources(tx, row.id, resourceRows);
        }
        if (metricRows !== undefined) {
          await this.replaceMetrics(tx, row.id, metricRows);
        }
        return row;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateProjectInput): Promise<ProjectRow> {
    await this.findByIdAdmin(id);
    if (input.featuredOnHome === true) {
      await this.assertFeaturedOnHomeQuota(id, true);
    }

    const resolvedCover = await this.resolveCoverMediaId(input.coverMediaId);
    const updateInput =
      resolvedCover !== undefined
        ? { ...input, coverMediaId: resolvedCover }
        : input;

    const patch = this.buildOverviewPatch(updateInput);
    const sectionRows =
      input.sections !== undefined
        ? normalizeSectionInputs(input.sections)
        : undefined;
    if (sectionRows !== undefined) {
      await this.assertSectionFigureMediaIds(sectionRows);
    }
    const resourceRows =
      input.resources !== undefined
        ? normalizeResourceInputs(input.resources)
        : undefined;
    const metricRows =
      input.metrics !== undefined
        ? normalizeMetricInputs(input.metrics)
        : undefined;

    const hasChildUpdates =
      sectionRows !== undefined ||
      resourceRows !== undefined ||
      metricRows !== undefined;

    if (Object.keys(patch).length === 0 && !hasChildUpdates) {
      return this.findByIdAdmin(id);
    }

    try {
      return await this.db.transaction(async (tx) => {
        let row: ProjectRow;
        if (Object.keys(patch).length > 0) {
          const [updated] = await tx
            .update(projects)
            .set(patch)
            .where(eq(projects.id, id))
            .returning();
          if (!updated) {
            throw new NotFoundException('Project not found');
          }
          row = updated;
        } else {
          row = await this.findByIdAdmin(id);
        }
        if (sectionRows !== undefined) {
          await this.replaceSections(tx, id, sectionRows);
        }
        if (resourceRows !== undefined) {
          await this.replaceResources(tx, id, resourceRows);
        }
        if (metricRows !== undefined) {
          await this.replaceMetrics(tx, id, metricRows);
        }
        return row;
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug already exists');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async countFeaturedOnHome(excludeProjectId?: string): Promise<number> {
    const conditions = [eq(projects.featuredOnHome, true)];
    if (excludeProjectId) {
      conditions.push(ne(projects.id, excludeProjectId));
    }
    const rows = await this.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(...conditions));
    return rows.length;
  }

  async assertFeaturedOnHomeQuota(
    excludeProjectId: string | undefined,
    enabling: boolean,
  ): Promise<void> {
    if (!enabling) return;
    const count = await this.countFeaturedOnHome(excludeProjectId);
    if (count >= MAX_FEATURED_ON_HOME) {
      throw new BadRequestException(
        `At most ${MAX_FEATURED_ON_HOME} projects can be featured on the home page`,
      );
    }
  }

  async findPublishedBySlug(slug: string, now = new Date()): Promise<ProjectRow> {
    const [row] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Project not found');
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      )
    ) {
      throw new NotFoundException('Project not found');
    }
    return row;
  }

  async listPublished(now = new Date()): Promise<ProjectRow[]> {
    const rows = await this.db
      .select()
      .from(projects)
      .orderBy(asc(projects.sortOrder), asc(projects.title));

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

  async adjacentPublishedSlugs(
    slug: string,
    now = new Date(),
  ): Promise<{ prevSlug?: string; nextSlug?: string }> {
    const slugs = await this.listPublishedSlugs(now);
    const index = slugs.indexOf(slug);
    if (index === -1) {
      return {};
    }
    return {
      ...(index > 0 ? { prevSlug: slugs[index - 1] } : {}),
      ...(index < slugs.length - 1 ? { nextSlug: slugs[index + 1] } : {}),
    };
  }

  async listPublishedFeaturedForHome(
    limit = MAX_FEATURED_ON_HOME,
    now = new Date(),
  ): Promise<ProjectRow[]> {
    const published = await this.listPublished(now);
    return published.filter((row) => row.featuredOnHome).slice(0, limit);
  }

  async loadSectionsForProject(projectId: string): Promise<ProjectSectionRow[]> {
    return this.db
      .select()
      .from(projectSections)
      .where(eq(projectSections.projectId, projectId))
      .orderBy(asc(projectSections.sortOrder));
  }

  async loadResourcesForProject(
    projectId: string,
  ): Promise<ProjectResourceRow[]> {
    return this.db
      .select()
      .from(projectResources)
      .where(eq(projectResources.projectId, projectId))
      .orderBy(asc(projectResources.sortOrder));
  }

  async loadMediaByIds(
    mediaIds: string[],
  ): Promise<Map<string, { url: string; alt: string | null }>> {
    const map = new Map<string, { url: string; alt: string | null }>();
    if (mediaIds.length === 0) {
      return map;
    }
    const rows = await this.db
      .select({ id: media.id, url: media.url, alt: media.alt })
      .from(media)
      .where(inArray(media.id, mediaIds));
    for (const row of rows) {
      map.set(row.id, { url: row.url, alt: row.alt });
    }
    return map;
  }

  async loadResourcesForProjects(
    projectIds: string[],
  ): Promise<Map<string, ProjectResourceRow[]>> {
    const map = new Map<string, ProjectResourceRow[]>();
    if (projectIds.length === 0) {
      return map;
    }
    const rows = await this.db
      .select()
      .from(projectResources)
      .where(inArray(projectResources.projectId, projectIds))
      .orderBy(asc(projectResources.sortOrder));
    for (const row of rows) {
      const list = map.get(row.projectId) ?? [];
      list.push(row);
      map.set(row.projectId, list);
    }
    return map;
  }

  private buildPublishedPublicWhere(
    query: ListPublishedPublicProjectsQuery,
    now: Date,
  ): SQL {
    const conditions: SQL[] = [projectVisibleSql(now)];

    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(projects.title, pattern),
          ilike(projects.slug, pattern),
          ilike(projects.summary, pattern),
          ilike(projects.ownerContribution, pattern),
          ilike(projects.resultTeaser, pattern),
        )!,
      );
      conditions.push(eq(projects.hideFromSearch, false));
    }
    const tag = query.tag?.trim();
    if (tag) {
      conditions.push(sql`${projects.tags} @> ARRAY[${tag}]::text[]`);
    }
    if (query.projectType) {
      conditions.push(eq(projects.projectType, query.projectType));
    }
    if (query.projectStatus) {
      conditions.push(eq(projects.projectStatus, query.projectStatus));
    }
    if (query.featured === true) {
      conditions.push(eq(projects.featured, true));
    }
    if (query.excludeFeatured === true) {
      conditions.push(eq(projects.featured, false));
    }

    return and(...conditions)!;
  }

  private async mapRowsToPublicCards(
    rows: ProjectRow[],
  ): Promise<ProjectPublicCard[]> {
    const resourceMap = await this.loadResourcesForProjects(
      rows.map((row) => row.id),
    );
    const coverIds = [
      ...new Set(
        rows
          .map((row) => row.coverMediaId)
          .filter((id): id is string => id != null),
      ),
    ];
    const coverMap = await this.loadMediaByIds(coverIds);
    return rows.map((row) => {
      const card = this.toPublicCard(row, resourceMap.get(row.id) ?? []);
      if (!row.coverMediaId) return card;
      const cover = coverMap.get(row.coverMediaId);
      if (!cover) return card;
      return {
        ...card,
        coverUrl: cover.url,
        coverAlt: cover.alt,
      };
    });
  }

  async listPublishedPublic(
    query: ListPublishedPublicProjectsQuery = {},
    now = new Date(),
  ): Promise<PaginatedResponse<ProjectPublicCard>> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_PUBLIC_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const offset = (page - 1) * limit;
    const whereClause = this.buildPublishedPublicWhere(query, now);

    const [countRow] = await this.db
      .select({ total: count() })
      .from(projects)
      .where(whereClause);
    const total = Number(countRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(projects)
      .where(whereClause)
      .orderBy(asc(projects.sortOrder), asc(projects.title))
      .limit(limit)
      .offset(offset);

    const items = await this.mapRowsToPublicCards(rows);
    return buildPaginatedResponse(items, { page, limit, total });
  }

  async listPublishedPublicCards(
    query: ListPublishedPublicProjectsQuery = {},
    now = new Date(),
  ): Promise<ProjectPublicCard[]> {
    const result = await this.listPublishedPublic(query, now);
    return result.items;
  }

  async findPublishedDetailBySlug(
    slug: string,
    now = new Date(),
  ): Promise<ProjectPublicDetail> {
    const row = await this.findPublishedBySlug(slug, now);
    const [sections, resources, metrics] = await Promise.all([
      this.loadSectionsForProject(row.id),
      this.loadResourcesForProject(row.id),
      this.loadMetricsForProject(row.id),
    ]);
    return this.toPublicDetail(row, sections, resources, metrics);
  }

  async loadMetricsForProject(projectId: string): Promise<ProjectMetricRow[]> {
    return this.db
      .select()
      .from(projectMetrics)
      .where(eq(projectMetrics.projectId, projectId))
      .orderBy(asc(projectMetrics.sortOrder));
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

  private async resolveCoverAlt(
    coverMediaId: string | null,
  ): Promise<string | null> {
    if (!coverMediaId) return null;
    try {
      const row = await this.media.findById(coverMediaId);
      return row.alt;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }
  }

  private async coverChecklistContext(coverMediaId: string | null) {
    if (!coverMediaId) {
      return { coverAlt: null, coverMediaMissing: false };
    }
    try {
      const row = await this.media.findById(coverMediaId);
      return { coverAlt: row.alt, coverMediaMissing: false };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { coverAlt: null, coverMediaMissing: true };
      }
      throw error;
    }
  }

  async getPublishChecklist(id: string) {
    const row = await this.findByIdAdmin(id);
    const [sections, resources, metrics] = await Promise.all([
      this.loadSectionsForProject(id),
      this.loadResourcesForProject(id),
      this.loadMetricsForProject(id),
    ]);
    const context = await this.coverChecklistContext(row.coverMediaId);
    return projectPublishChecklist(row, sections, resources, metrics, context);
  }

  async previewForAdmin(id: string): Promise<ProjectPublicDetail> {
    const row = await this.findByIdAdmin(id);
    const [sections, resources, metrics] = await Promise.all([
      this.loadSectionsForProject(id),
      this.loadResourcesForProject(id),
      this.loadMetricsForProject(id),
    ]);
    return this.toPublicDetail(row, sections, resources, metrics);
  }

  async publish(
    id: string,
    options: PublishProjectOptions = {},
  ): Promise<ProjectRow> {
    const row = await this.findByIdAdmin(id);
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

    if (row.featuredOnHome) {
      await this.assertFeaturedOnHomeQuota(id, true);
    }
    const [updated] = await this.db
      .update(projects)
      .set({
        publishStatus: 'published',
        publishedAt: new Date(),
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Project not found');
    }
    return updated;
  }

  async unpublish(id: string): Promise<ProjectRow> {
    const [updated] = await this.db
      .update(projects)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Project not found');
    }
    return updated;
  }

  async schedule(id: string, scheduledAt: Date): Promise<ProjectRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(projects)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Project not found');
    }
    return updated;
  }

  async archive(id: string): Promise<ProjectRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(projects)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Project not found');
    }
    return updated;
  }

  async publishDueScheduled(now = new Date()): Promise<number> {
    const due = await this.db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.publishStatus, 'scheduled'),
          lte(projects.scheduledAt, now),
        ),
      );
    for (const row of due) {
      await this.publish(row.id);
    }
    return due.length;
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
    if (query.projectType) {
      conditions.push(eq(projects.projectType, query.projectType));
    }
    if (query.featured === true) {
      conditions.push(eq(projects.featured, true));
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

  async listPublicationIdsForProject(projectId: string): Promise<string[]> {
    const rows = await this.db
      .select({ publicationId: projectPublications.publicationId })
      .from(projectPublications)
      .where(eq(projectPublications.projectId, projectId))
      .orderBy(
        asc(projectPublications.sortOrder),
        asc(projectPublications.createdAt),
      );
    return rows.map((row) => row.publicationId);
  }

  async replacePublications(
    projectId: string,
    publicationIds: string[],
  ): Promise<void> {
    if (publicationIds.length > MAX_PROJECT_PUBLICATIONS) {
      throw new BadRequestException(
        `At most ${MAX_PROJECT_PUBLICATIONS} publications allowed`,
      );
    }
    const seen = new Set<string>();
    const uniqueIds: string[] = [];
    for (const id of publicationIds) {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }
    await this.publications.assertAllExist(uniqueIds);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(projectPublications)
        .where(eq(projectPublications.projectId, projectId));
      if (uniqueIds.length === 0) {
        return;
      }
      await tx.insert(projectPublications).values(
        uniqueIds.map((publicationId, index) => ({
          projectId,
          publicationId,
          sortOrder: index,
        })),
      );
    });
  }

  async listThemeIdsForProject(projectId: string): Promise<string[]> {
    const rows = await this.db
      .select({ themeId: researchThemeProjects.themeId })
      .from(researchThemeProjects)
      .where(eq(researchThemeProjects.projectId, projectId))
      .orderBy(
        asc(researchThemeProjects.sortOrder),
        asc(researchThemeProjects.createdAt),
      );
    return rows.map((row) => row.themeId);
  }

  async loadSectionMediaIdsBySectionIds(
    sectionIds: string[],
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (sectionIds.length === 0) {
      return map;
    }
    const rows = await this.db
      .select()
      .from(projectSectionMedia)
      .where(inArray(projectSectionMedia.sectionId, sectionIds))
      .orderBy(asc(projectSectionMedia.sortOrder));
    for (const row of rows) {
      const list = map.get(row.sectionId) ?? [];
      list.push(row.mediaId);
      map.set(row.sectionId, list);
    }
    return map;
  }

  attachSectionFiguresToPublicSections(
    sectionRows: ProjectSectionRow[],
    sections: ProjectPublicSection[],
    mediaBySectionId: Map<string, string[]>,
    mediaById: Map<string, { url: string; alt: string | null }>,
  ): ProjectPublicSection[] {
    const sortedRows = sectionRows
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return sections.map((section, index) => {
      const row = sortedRows[index];
      if (!row) return section;
      const mediaIds = mediaBySectionId.get(row.id) ?? [];
      const figures = mediaIds
        .map((id) => mediaById.get(id))
        .filter((m): m is { url: string; alt: string | null } => m != null)
        .map((m) => ({
          url: m.url,
          alt: m.alt,
        }));
      if (figures.length === 0) return section;
      return { ...section, figures };
    });
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
