import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { asc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { navItems, siteSettings } from '../../db/schema/site';
import { SitePagesService } from '../site-pages/site-pages.service';

@Injectable()
export class SiteService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly sitePages: SitePagesService,
  ) {}

  async getOrCreateSettings() {
    const [existing] = await this.db.select().from(siteSettings).limit(1);
    if (existing) return existing;
    const [created] = await this.db
      .insert(siteSettings)
      .values({ siteName: 'SIAM' })
      .returning();
    return created;
  }

  async updateSettings(input: {
    siteName?: string;
    defaultMetaDescription?: string | null;
    footerText?: string | null;
    faviconUrl?: string | null;
  }) {
    const current = await this.getOrCreateSettings();
    const [row] = await this.db
      .update(siteSettings)
      .set(input)
      .where(eq(siteSettings.id, current.id))
      .returning();
    return row;
  }

  async listNav() {
    return this.db.select().from(navItems).orderBy(asc(navItems.sortOrder));
  }

  async upsertNavItem(input: {
    id?: string;
    label: string;
    path: string;
    sortOrder?: number;
    visible?: boolean;
  }) {
    if (input.id) {
      const [row] = await this.db
        .update(navItems)
        .set({
          label: input.label,
          path: input.path,
          sortOrder: input.sortOrder ?? 0,
          visible: input.visible ?? true,
        })
        .where(eq(navItems.id, input.id))
        .returning();
      if (!row) throw new NotFoundException('Nav item not found');
      return row;
    }
    const [row] = await this.db
      .insert(navItems)
      .values({
        label: input.label,
        path: input.path,
        sortOrder: input.sortOrder ?? 0,
        visible: input.visible ?? true,
      })
      .returning();
    return row;
  }

  async getPublicSite() {
    const settings = await this.getOrCreateSettings();
    const nav = (await this.listNav()).filter((n) => n.visible);
    const pageSlugs = await this.sitePages.listPublishedSlugs();
    return {
      siteName: settings.siteName,
      defaultMetaDescription: settings.defaultMetaDescription,
      footerText: settings.footerText,
      faviconUrl: settings.faviconUrl,
      nav,
      sitemapPaths: ['/', '/about', ...pageSlugs.map((s) => `/pages/${s}`)],
    };
  }
}
