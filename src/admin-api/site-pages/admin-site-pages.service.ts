import { Injectable } from '@nestjs/common';
import { SitePagesService } from '../../domain/site-pages/site-pages.service';
import type { CreateSitePageBody } from './dto/create-site-page.dto';
import type { UpdateSitePageBody } from './dto/update-site-page.dto';
import type { SitePageAdminResponse } from './dto/site-page-admin-response.dto';

@Injectable()
export class AdminSitePagesService {
  constructor(private readonly sitePages: SitePagesService) {}

  private mapAdmin(
    row: Awaited<ReturnType<SitePagesService['findByIdAdmin']>>,
  ): SitePageAdminResponse {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      body: row.body,
      publishStatus: row.publishStatus,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list() {
    const rows = await this.sitePages.findAllAdmin();
    return rows.map((row) => this.mapAdmin(row));
  }

  async create(input: CreateSitePageBody) {
    return this.mapAdmin(await this.sitePages.create(input));
  }

  async get(id: string) {
    return this.mapAdmin(await this.sitePages.findByIdAdmin(id));
  }

  async preview(id: string) {
    return this.mapAdmin(await this.sitePages.preview(id));
  }

  async update(id: string, input: UpdateSitePageBody) {
    return this.mapAdmin(await this.sitePages.update(id, input));
  }

  async publish(id: string) {
    return this.mapAdmin(await this.sitePages.publish(id));
  }

  async unpublish(id: string) {
    return this.mapAdmin(await this.sitePages.unpublish(id));
  }

  async archive(id: string) {
    return this.mapAdmin(await this.sitePages.archive(id));
  }

  async schedule(id: string, scheduledAt: Date) {
    return this.mapAdmin(await this.sitePages.schedule(id, scheduledAt));
  }

  listRevisions(id: string) {
    return this.sitePages.listRevisions(id);
  }

  async restore(id: string, revisionId: string) {
    return this.mapAdmin(await this.sitePages.restoreRevision(id, revisionId));
  }
}
