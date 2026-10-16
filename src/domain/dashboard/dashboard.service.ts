import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sitePages } from '../../db/schema/site-pages';
import { media } from '../../db/schema/media';

@Injectable()
export class DashboardService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async getCounts() {
    const pages = await this.db.select().from(sitePages);
    const countBy = (status: string) =>
      pages.filter((p) => p.publishStatus === status).length;
    const mediaRows = await this.db.select().from(media);
    return {
      pages: {
        draft: countBy('draft'),
        published: countBy('published'),
        scheduled: countBy('scheduled'),
        archived: countBy('archived'),
      },
      media: mediaRows.length,
    };
  }
}
