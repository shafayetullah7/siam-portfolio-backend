import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, ilike, lte, ne, or, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import {
  researchThemeProjects,
  researchThemePublications,
  researchThemeResources,
  researchThemes,
} from '../../db/schema/research';
import { projects } from '../../db/schema/projects';
import { publications } from '../../db/schema/publications';
import { MediaService } from '../media/media.service';
import { ProjectsService } from '../projects/projects.service';
import { PublicationsService } from '../publications/publications.service';
import { RevisionsService } from '../revisions/revisions.service';
import {
  researchPublishChecklist,
  type ResearchPublishChecklistResult,
} from './research-publish-checklist';
import { assertPublishable } from './research-publish.rules';
import {
  RESEARCH_THEME_ENTITY_TYPE,
  isEmptyResearchThemeRevisionDelta,
  researchThemeRevisionDelta,
  researchThemeToSnapshot,
  snapshotToResearchThemePatch,
  type ResearchThemeRevisionSnapshot,
} from './research-revision.snapshot';
import type {
  CreateResearchThemeInput,
  ListAdminResearchQuery,
  ResearchThemeResourceInput,
  ResearchThemeResourceRow,
  ResearchThemeRow,
  UpdateResearchThemeInput,
} from './research.types';

const MAX_THEME_RESOURCES = 20;
const MAX_THEME_PUBLICATIONS = 20;
const MAX_THEME_PROJECTS = 20;
const MAX_FEATURED_ON_HOME = 6;

@Injectable()
export class ResearchService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly revisions: RevisionsService,
    private readonly media: MediaService,
    private readonly publicationCatalog: PublicationsService,
    private readonly projectCatalog: ProjectsService,
  ) {}

  private async resolveCoverMediaId(
    coverMediaId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (coverMediaId === undefined) return undefined;
    if (coverMediaId === null) return null;
    await this.media.assertImageMediaId(coverMediaId);
    return coverMediaId;
  }

  private assertHttpsResourceUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed.startsWith('https://')) {
      throw new BadRequestException('Resource URL must use HTTPS');
    }
    return trimmed;
  }

  async listResources(themeId: string): Promise<ResearchThemeResourceRow[]> {
    return this.db
      .select()
      .from(researchThemeResources)
      .where(eq(researchThemeResources.themeId, themeId))
      .orderBy(
        asc(researchThemeResources.sortOrder),
        asc(researchThemeResources.createdAt),
      );
  }

  async replaceResources(
    themeId: string,
    items: ResearchThemeResourceInput[],
  ): Promise<void> {
    if (items.length > MAX_THEME_RESOURCES) {
      throw new BadRequestException(
        `At most ${MAX_THEME_RESOURCES} resources allowed`,
      );
    }
    const normalized = items.map((item, index) => ({
      label: item.label.trim(),
      url: this.assertHttpsResourceUrl(item.url),
      resourceType: item.resourceType,
      sortOrder: item.sortOrder ?? index,
    }));

    await this.db.transaction(async (tx) => {
      await tx
        .delete(researchThemeResources)
        .where(eq(researchThemeResources.themeId, themeId));
      if (normalized.length === 0) {
        return;
      }
      await tx.insert(researchThemeResources).values(
        normalized.map((item) => ({
          themeId,
          label: item.label,
          url: item.url,
          resourceType: item.resourceType,
          sortOrder: item.sortOrder,
        })),
      );
    });
  }

  async listPublicationIdsForTheme(themeId: string): Promise<string[]> {
    const rows = await this.db
      .select({ publicationId: researchThemePublications.publicationId })
      .from(researchThemePublications)
      .where(eq(researchThemePublications.themeId, themeId))
      .orderBy(
        asc(researchThemePublications.sortOrder),
        asc(researchThemePublications.createdAt),
      );
    return rows.map((row) => row.publicationId);
  }

  async replacePublications(
    themeId: string,
    publicationIds: string[],
  ): Promise<void> {
    if (publicationIds.length > MAX_THEME_PUBLICATIONS) {
      throw new BadRequestException(
        `At most ${MAX_THEME_PUBLICATIONS} publications allowed`,
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
    await this.publicationCatalog.assertAllExist(uniqueIds);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(researchThemePublications)
        .where(eq(researchThemePublications.themeId, themeId));
      if (uniqueIds.length === 0) {
        return;
      }
      await tx.insert(researchThemePublications).values(
        uniqueIds.map((publicationId, index) => ({
          themeId,
          publicationId,
          sortOrder: index,
        })),
      );
    });
  }

  async listUnpublishedLinkedPublicationTitles(
    themeId: string,
    now = new Date(),
  ): Promise<string[]> {
    const rows = await this.db
      .select({
        title: publications.title,
        publishStatus: publications.publishStatus,
        scheduledAt: publications.scheduledAt,
      })
      .from(researchThemePublications)
      .innerJoin(
        publications,
        eq(researchThemePublications.publicationId, publications.id),
      )
      .where(eq(researchThemePublications.themeId, themeId))
      .orderBy(asc(researchThemePublications.sortOrder));

    return rows
      .filter(
        (row) =>
          !isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
            now,
          ),
      )
      .map((row) => row.title);
  }

  async listProjectIdsForTheme(themeId: string): Promise<string[]> {
    const rows = await this.db
      .select({ projectId: researchThemeProjects.projectId })
      .from(researchThemeProjects)
      .where(eq(researchThemeProjects.themeId, themeId))
      .orderBy(
        asc(researchThemeProjects.sortOrder),
        asc(researchThemeProjects.createdAt),
      );
    return rows.map((row) => row.projectId);
  }

  async replaceProjects(themeId: string, projectIds: string[]): Promise<void> {
    if (projectIds.length > MAX_THEME_PROJECTS) {
      throw new BadRequestException(
        `At most ${MAX_THEME_PROJECTS} projects allowed`,
      );
    }
    const seen = new Set<string>();
    const uniqueIds: string[] = [];
    for (const id of projectIds) {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    }
    await this.projectCatalog.assertAllExist(uniqueIds);

    await this.db.transaction(async (tx) => {
      await tx
        .delete(researchThemeProjects)
        .where(eq(researchThemeProjects.themeId, themeId));
      if (uniqueIds.length === 0) {
        return;
      }
      await tx.insert(researchThemeProjects).values(
        uniqueIds.map((projectId, index) => ({
          themeId,
          projectId,
          sortOrder: index,
        })),
      );
    });
  }

  async listUnpublishedLinkedProjectTitles(
    themeId: string,
    now = new Date(),
  ): Promise<string[]> {
    const rows = await this.db
      .select({
        title: projects.title,
        publishStatus: projects.publishStatus,
        scheduledAt: projects.scheduledAt,
      })
      .from(researchThemeProjects)
      .innerJoin(projects, eq(researchThemeProjects.projectId, projects.id))
      .where(eq(researchThemeProjects.themeId, themeId))
      .orderBy(asc(researchThemeProjects.sortOrder));

    return rows
      .filter(
        (row) =>
          !isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
            now,
          ),
      )
      .map((row) => row.title);
  }

  async countFeaturedOnHome(excludeThemeId?: string): Promise<number> {
    const conditions = [eq(researchThemes.featuredOnHome, true)];
    if (excludeThemeId) {
      conditions.push(ne(researchThemes.id, excludeThemeId));
    }
    const rows = await this.db
      .select({ id: researchThemes.id })
      .from(researchThemes)
      .where(and(...conditions));
    return rows.length;
  }

  async assertFeaturedOnHomeQuota(
    excludeThemeId: string | undefined,
    enabling: boolean,
  ): Promise<void> {
    if (!enabling) return;
    const count = await this.countFeaturedOnHome(excludeThemeId);
    if (count >= MAX_FEATURED_ON_HOME) {
      throw new BadRequestException(
        `At most ${MAX_FEATURED_ON_HOME} themes can be featured on the home page`,
      );
    }
  }

  async listPublishedFeaturedForHome(
    limit = MAX_FEATURED_ON_HOME,
  ): Promise<ResearchThemeRow[]> {
    const published = await this.listPublished();
    return published.filter((row) => row.featuredOnHome).slice(0, limit);
  }

  private async buildThemeSnapshot(
    id: string,
    row: ResearchThemeRow,
  ): Promise<ResearchThemeRevisionSnapshot> {
    const resourceRows = await this.listResources(id);
    const resources: ResearchThemeResourceInput[] = resourceRows.map((r) => ({
      label: r.label,
      url: r.url,
      resourceType: r.resourceType,
      sortOrder: r.sortOrder,
    }));
    const [publicationIds, projectIds] = await Promise.all([
      this.listPublicationIdsForTheme(id),
      this.listProjectIdsForTheme(id),
    ]);
    return researchThemeToSnapshot(row, resources, publicationIds, projectIds);
  }

  private async recordRevisionDelta(
    id: string,
    before: ResearchThemeRevisionSnapshot | undefined,
    afterRow: ResearchThemeRow,
  ): Promise<void> {
    const after = await this.buildThemeSnapshot(id, afterRow);
    const delta = researchThemeRevisionDelta(before, after);
    if (isEmptyResearchThemeRevisionDelta(delta)) return;
    await this.revisions.append(RESEARCH_THEME_ENTITY_TYPE, id, delta);
  }

  async create(input: CreateResearchThemeInput): Promise<ResearchThemeRow> {
    const coverMediaId =
      input.coverMediaId != null
        ? await this.resolveCoverMediaId(input.coverMediaId)
        : null;
    if (input.featuredOnHome) {
      await this.assertFeaturedOnHomeQuota(undefined, true);
    }
    try {
      const [row] = await this.db
        .insert(researchThemes)
        .values({
          slug: input.slug.trim(),
          title: input.title.trim(),
          summary: input.summary.trim(),
          themeStatus: input.themeStatus ?? 'ongoing',
          problem: input.problem?.trim() ?? '',
          significance: input.significance ?? null,
          objectives: input.objectives ?? null,
          approach: input.approach ?? null,
          findings: input.findings ?? null,
          limitations: input.limitations ?? null,
          futureWork: input.futureWork ?? null,
          tags: input.tags ?? null,
          linkLabel: input.linkLabel ?? null,
          coverMediaId: coverMediaId ?? null,
          sortOrder: input.sortOrder ?? 0,
          featuredOnHome: input.featuredOnHome ?? false,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          collaborators: input.collaborators ?? null,
          acknowledgments: input.acknowledgments ?? null,
          funding: input.funding ?? null,
        })
        .returning();
      if (input.resources != null) {
        await this.replaceResources(row.id, input.resources);
      }
      await this.recordRevisionDelta(row.id, undefined, row);
      return row;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException('Slug already exists');
    }
  }

  async findByIdAdmin(id: string): Promise<ResearchThemeRow> {
    const [row] = await this.db
      .select()
      .from(researchThemes)
      .where(eq(researchThemes.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Research theme not found');
    }
    return row;
  }

  async update(
    id: string,
    input: UpdateResearchThemeInput,
  ): Promise<ResearchThemeRow> {
    const beforeRow = await this.findByIdAdmin(id);
    const patch: Partial<typeof researchThemes.$inferInsert> = {};

    if (input.slug !== undefined) patch.slug = input.slug.trim();
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.themeStatus !== undefined) patch.themeStatus = input.themeStatus;
    if (input.problem !== undefined) patch.problem = input.problem.trim();
    if (input.significance !== undefined) patch.significance = input.significance;
    if (input.objectives !== undefined) patch.objectives = input.objectives;
    if (input.approach !== undefined) patch.approach = input.approach;
    if (input.findings !== undefined) patch.findings = input.findings;
    if (input.limitations !== undefined) patch.limitations = input.limitations;
    if (input.futureWork !== undefined) patch.futureWork = input.futureWork;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.linkLabel !== undefined) patch.linkLabel = input.linkLabel;
    if (input.coverMediaId !== undefined) {
      patch.coverMediaId = await this.resolveCoverMediaId(input.coverMediaId);
    }
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.featuredOnHome !== undefined) {
      patch.featuredOnHome = input.featuredOnHome;
    }
    if (input.seoTitle !== undefined) patch.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) {
      patch.seoDescription = input.seoDescription;
    }
    if (input.collaborators !== undefined) {
      patch.collaborators = input.collaborators;
    }
    if (input.acknowledgments !== undefined) {
      patch.acknowledgments = input.acknowledgments;
    }
    if (input.funding !== undefined) patch.funding = input.funding;

    if (input.featuredOnHome === true) {
      await this.assertFeaturedOnHomeQuota(id, true);
    }

    try {
      const [row] = await this.db
        .update(researchThemes)
        .set(patch)
        .where(eq(researchThemes.id, id))
        .returning();
      if (input.resources !== undefined) {
        await this.replaceResources(id, input.resources ?? []);
      }
      const beforeSnap = await this.buildThemeSnapshot(id, beforeRow);
      await this.recordRevisionDelta(id, beforeSnap, row);
      return row;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException('Slug already exists');
    }
  }

  async listAdmin(
    query: ListAdminResearchQuery = {},
  ): Promise<ResearchThemeRow[]> {
    const conditions: SQL[] = [];
    if (query.q?.trim()) {
      const pattern = `%${query.q.trim()}%`;
      conditions.push(
        or(
          ilike(researchThemes.title, pattern),
          ilike(researchThemes.slug, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(researchThemes.publishStatus, query.publishStatus));
    }
    if (query.themeStatus) {
      conditions.push(eq(researchThemes.themeStatus, query.themeStatus));
    }
    if (query.featured === true) {
      conditions.push(eq(researchThemes.featuredOnHome, true));
    } else if (query.featured === false) {
      conditions.push(eq(researchThemes.featuredOnHome, false));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(researchThemes)
      .where(where)
      .orderBy(asc(researchThemes.sortOrder), asc(researchThemes.title));
  }

  async findPublishedBySlug(slug: string): Promise<ResearchThemeRow> {
    const [row] = await this.db
      .select()
      .from(researchThemes)
      .where(eq(researchThemes.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Research theme not found');
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
      )
    ) {
      throw new NotFoundException('Research theme not found');
    }
    return row;
  }

  async listPublishedSlugs(): Promise<string[]> {
    const rows = await this.db
      .select({ slug: researchThemes.slug, publishStatus: researchThemes.publishStatus, scheduledAt: researchThemes.scheduledAt })
      .from(researchThemes)
      .orderBy(asc(researchThemes.sortOrder), asc(researchThemes.title));

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        ),
      )
      .map((row) => row.slug);
  }

  async adjacentPublishedSlugs(
    slug: string,
  ): Promise<{ prevSlug?: string; nextSlug?: string }> {
    const slugs = await this.listPublishedSlugs();
    const index = slugs.indexOf(slug);
    if (index === -1) {
      return {};
    }
    return {
      ...(index > 0 ? { prevSlug: slugs[index - 1] } : {}),
      ...(index < slugs.length - 1 ? { nextSlug: slugs[index + 1] } : {}),
    };
  }

  async listPublished(): Promise<ResearchThemeRow[]> {
    const rows = await this.db
      .select()
      .from(researchThemes)
      .orderBy(asc(researchThemes.sortOrder), asc(researchThemes.title));

    return rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
      ),
    );
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

  async getPublishChecklist(id: string): Promise<ResearchPublishChecklistResult> {
    const row = await this.findByIdAdmin(id);
    const coverAlt = await this.resolveCoverAlt(row.coverMediaId);
    const [unpublishedPublicationTitles, unpublishedProjectTitles] =
      await Promise.all([
        this.listUnpublishedLinkedPublicationTitles(id),
        this.listUnpublishedLinkedProjectTitles(id),
      ]);
    return researchPublishChecklist(row, {
      coverAlt,
      unpublishedPublicationTitles,
      unpublishedProjectTitles,
    });
  }

  assertPublishable(theme: ResearchThemeRow): void {
    assertPublishable(theme);
  }

  async publish(
    id: string,
    options: { confirmWarnings?: boolean } = {},
  ): Promise<ResearchThemeRow> {
    const row = await this.findByIdAdmin(id);
    const beforeSnap = await this.buildThemeSnapshot(id, row);
    const coverAlt = await this.resolveCoverAlt(row.coverMediaId);
    const [unpublishedPublicationTitles, unpublishedProjectTitles] =
      await Promise.all([
        this.listUnpublishedLinkedPublicationTitles(id),
        this.listUnpublishedLinkedProjectTitles(id),
      ]);
    const checklist = researchPublishChecklist(row, {
      coverAlt,
      unpublishedPublicationTitles,
      unpublishedProjectTitles,
    });

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

    const [updated] = await this.db
      .update(researchThemes)
      .set({
        publishStatus: 'published',
        publishedAt: new Date(),
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(researchThemes.id, id))
      .returning();
    await this.recordRevisionDelta(id, beforeSnap, updated);
    return updated;
  }

  async unpublish(id: string): Promise<ResearchThemeRow> {
    const beforeRow = await this.findByIdAdmin(id);
    const beforeSnap = await this.buildThemeSnapshot(id, beforeRow);
    const [updated] = await this.db
      .update(researchThemes)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
      })
      .where(eq(researchThemes.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Research theme not found');
    }
    await this.recordRevisionDelta(id, beforeSnap, updated);
    return updated;
  }

  async schedule(id: string, scheduledAt: Date): Promise<ResearchThemeRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    const beforeRow = await this.findByIdAdmin(id);
    const beforeSnap = await this.buildThemeSnapshot(id, beforeRow);
    const [updated] = await this.db
      .update(researchThemes)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(researchThemes.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Research theme not found');
    }
    await this.recordRevisionDelta(id, beforeSnap, updated);
    return updated;
  }

  async archive(id: string): Promise<ResearchThemeRow> {
    const beforeRow = await this.findByIdAdmin(id);
    const beforeSnap = await this.buildThemeSnapshot(id, beforeRow);
    const [updated] = await this.db
      .update(researchThemes)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(researchThemes.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Research theme not found');
    }
    await this.recordRevisionDelta(id, beforeSnap, updated);
    return updated;
  }

  async listRevisions(id: string) {
    await this.findByIdAdmin(id);
    return this.revisions.list(RESEARCH_THEME_ENTITY_TYPE, id);
  }

  async restoreRevision(id: string, revisionId: string): Promise<ResearchThemeRow> {
    const theme = await this.findByIdAdmin(id);
    const revision = await this.revisions.getById(revisionId);
    if (!revision || revision.entityId !== theme.id) {
      throw new NotFoundException('Revision not found');
    }
    const beforeSnap = await this.buildThemeSnapshot(id, theme);
    const snap = revision.snapshot as Partial<ResearchThemeRevisionSnapshot>;
    const patch = snapshotToResearchThemePatch(snap, theme);
    try {
      const [updated] = await this.db
        .update(researchThemes)
        .set(patch)
        .where(eq(researchThemes.id, id))
        .returning();
      if (snap.resources !== undefined) {
        await this.replaceResources(id, snap.resources ?? []);
      }
      if (snap.publicationIds !== undefined) {
        await this.replacePublications(id, snap.publicationIds ?? []);
      }
      if (snap.projectIds !== undefined) {
        await this.replaceProjects(id, snap.projectIds ?? []);
      }
      await this.recordRevisionDelta(id, beforeSnap, updated);
      return updated;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ConflictException('Slug already exists');
    }
  }

  async publishDueScheduled(now = new Date()): Promise<number> {
    const due = await this.db
      .select()
      .from(researchThemes)
      .where(
        and(
          eq(researchThemes.publishStatus, 'scheduled'),
          lte(researchThemes.scheduledAt, now),
        ),
      );
    for (const row of due) {
      await this.publish(row.id);
    }
    return due.length;
  }
}
