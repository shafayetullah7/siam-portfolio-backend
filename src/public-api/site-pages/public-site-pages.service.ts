import { Injectable } from '@nestjs/common';
import { SitePagesService } from '../../domain/site-pages/site-pages.service';
import type { SitePagePublicResponse } from './dto/site-page-public-response.dto';

@Injectable()
export class PublicSitePagesService {
  constructor(private readonly sitePages: SitePagesService) {}

  async getBySlug(slug: string): Promise<SitePagePublicResponse> {
    const row = await this.sitePages.findPublishedBySlug(slug);
    return {
      slug: row.slug,
      title: row.title,
      body: row.body,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  }
}
