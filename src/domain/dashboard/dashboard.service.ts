import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { count, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { publications } from '../../db/schema/publications';
import { projects } from '../../db/schema/projects';
import { sitePages } from '../../db/schema/site-pages';
import { media } from '../../db/schema/media';
import { articles } from '../../db/schema/writing/articles';

@Injectable()
export class DashboardService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async getCounts() {
    const pages = await this.db.select().from(sitePages);
    const countBy = (status: string) =>
      pages.filter((p) => p.publishStatus === status).length;
    const mediaRows = await this.db.select().from(media);
    const publicationStatuses = [
      'draft',
      'published',
      'scheduled',
      'archived',
    ] as const;
    const publicationCounts = await Promise.all(
      publicationStatuses.map(async (status) => {
        const [row] = await this.db
          .select({ total: count() })
          .from(publications)
          .where(eq(publications.publishStatus, status));
        return { status, total: Number(row?.total ?? 0) };
      }),
    );
    const publicationCountBy = (status: string) =>
      publicationCounts.find((c) => c.status === status)?.total ?? 0;
    const projectStatuses = [
      'draft',
      'published',
      'scheduled',
      'archived',
    ] as const;
    const projectCounts = await Promise.all(
      projectStatuses.map(async (status) => {
        const [row] = await this.db
          .select({ total: count() })
          .from(projects)
          .where(eq(projects.publishStatus, status));
        return { status, total: Number(row?.total ?? 0) };
      }),
    );
    const projectCountBy = (status: string) =>
      projectCounts.find((c) => c.status === status)?.total ?? 0;
    const writingStatuses = [
      'draft',
      'published',
      'scheduled',
      'archived',
    ] as const;
    const writingCounts = await Promise.all(
      writingStatuses.map(async (status) => {
        const [row] = await this.db
          .select({ total: count() })
          .from(articles)
          .where(eq(articles.publishStatus, status));
        return { status, total: Number(row?.total ?? 0) };
      }),
    );
    const writingCountBy = (status: string) =>
      writingCounts.find((c) => c.status === status)?.total ?? 0;
    return {
      pages: {
        draft: countBy('draft'),
        published: countBy('published'),
        scheduled: countBy('scheduled'),
        archived: countBy('archived'),
      },
      publications: {
        draft: publicationCountBy('draft'),
        published: publicationCountBy('published'),
        scheduled: publicationCountBy('scheduled'),
        archived: publicationCountBy('archived'),
      },
      projects: {
        draft: projectCountBy('draft'),
        published: projectCountBy('published'),
        scheduled: projectCountBy('scheduled'),
        archived: projectCountBy('archived'),
      },
      writing: {
        draft: writingCountBy('draft'),
        published: writingCountBy('published'),
        scheduled: writingCountBy('scheduled'),
        archived: writingCountBy('archived'),
      },
      media: mediaRows.length,
    };
  }
}
