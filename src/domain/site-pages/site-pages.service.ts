import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, asc, eq, lte } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { sitePages } from '../../db/schema/site-pages';
import { RevisionsService } from '../revisions/revisions.service';
import type {
  CreateSitePageInput,
  UpdateSitePageInput,
} from './site-pages.types';

const ENTITY_TYPE = 'site_page';

@Injectable()
export class SitePagesService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly revisions: RevisionsService,
  ) {}

  private toSnapshot(row: typeof sitePages.$inferSelect) {
    return {
      title: row.title,
      body: row.body,
      publishStatus: row.publishStatus,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
    };
  }

  async create(input: CreateSitePageInput) {
    try {
      const [row] = await this.db
        .insert(sitePages)
        .values({
          slug: input.slug,
          title: input.title,
          body: input.body ?? '',
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
        })
        .returning();
      await this.revisions.append(ENTITY_TYPE, row.id, this.toSnapshot(row));
      return row;
    } catch {
      throw new ConflictException('Slug already exists');
    }
  }

  async findAllAdmin() {
    return this.db.select().from(sitePages).orderBy(asc(sitePages.createdAt));
  }

  async findByIdAdmin(id: string) {
    const [row] = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Page not found');
    return row;
  }

  async update(id: string, input: UpdateSitePageInput) {
    const existing = await this.findByIdAdmin(id);
    const [row] = await this.db
      .update(sitePages)
      .set({
        ...input,
        body: input.body ?? existing.body,
      })
      .where(eq(sitePages.id, id))
      .returning();
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(row));
    return row;
  }

  async findPublishedBySlug(slug: string) {
    const [row] = await this.db
      .select()
      .from(sitePages)
      .where(eq(sitePages.slug, slug))
      .limit(1);
    if (!row) throw new NotFoundException('Page not found');
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
      )
    ) {
      throw new NotFoundException('Page not found');
    }
    return row;
  }

  async preview(id: string) {
    return this.findByIdAdmin(id);
  }

  async publish(id: string) {
    const row = await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(sitePages)
      .set({
        publishStatus: 'published',
        publishedAt: new Date(),
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(sitePages.id, id))
      .returning();
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(updated));
    return updated;
  }

  async unpublish(id: string) {
    const [updated] = await this.db
      .update(sitePages)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
      })
      .where(eq(sitePages.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Page not found');
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(updated));
    return updated;
  }

  async schedule(id: string, scheduledAt: Date) {
    const [updated] = await this.db
      .update(sitePages)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(sitePages.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Page not found');
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(updated));
    return updated;
  }

  async archive(id: string) {
    const [updated] = await this.db
      .update(sitePages)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(sitePages.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Page not found');
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(updated));
    return updated;
  }

  async listRevisions(id: string) {
    await this.findByIdAdmin(id);
    return this.revisions.list(ENTITY_TYPE, id);
  }

  async restoreRevision(id: string, revisionId: string) {
    const page = await this.findByIdAdmin(id);
    const revision = await this.revisions.getById(revisionId);
    if (!revision || revision.entityId !== page.id) {
      throw new NotFoundException('Revision not found');
    }
    const snap = revision.snapshot as {
      title?: string;
      body?: string;
      publishStatus?: PublishStatus;
      seoTitle?: string | null;
      seoDescription?: string | null;
    };
    const [updated] = await this.db
      .update(sitePages)
      .set({
        title: snap.title ?? page.title,
        body: snap.body ?? page.body,
        publishStatus: snap.publishStatus ?? page.publishStatus,
        seoTitle: snap.seoTitle ?? page.seoTitle,
        seoDescription: snap.seoDescription ?? page.seoDescription,
      })
      .where(eq(sitePages.id, id))
      .returning();
    await this.revisions.append(ENTITY_TYPE, id, this.toSnapshot(updated));
    return updated;
  }

  async publishDueScheduled(now = new Date()) {
    const due = await this.db
      .select()
      .from(sitePages)
      .where(
        and(
          eq(sitePages.publishStatus, 'scheduled'),
          lte(sitePages.scheduledAt, now),
        ),
      );
    for (const row of due) {
      await this.publish(row.id);
    }
    return due.length;
  }

  async listPublishedSlugs() {
    const rows = await this.db.select().from(sitePages);
    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
        ),
      )
      .map((row) => row.slug);
  }
}
