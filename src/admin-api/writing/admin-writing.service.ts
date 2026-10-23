import { Injectable } from '@nestjs/common';
import { PublicWritingService } from '../../public-api/writing/public-writing.service';
import { WritingService } from '../../domain/writing/writing.service';
import type {
  ArticleRow,
  CreateArticleInput,
  UpdateArticleInput,
} from '../../domain/writing/writing.types';
import type { ArticleAdminResponse } from './dto/article-admin-response.dto';
import type { CreateArticleBody } from './dto/create-article.dto';
import type { ListWritingQuery } from './dto/list-writing-query.dto';
import type { PublishArticleBody } from './dto/publish-article.dto';
import type { UpdateArticleBody } from './dto/update-article.dto';
import type { WritingAdminSummary } from './dto/writing-admin-summary.dto';

@Injectable()
export class AdminWritingService {
  constructor(
    private readonly writing: WritingService,
    private readonly publicWriting: PublicWritingService,
  ) {}

  private mapSummary(row: ArticleRow): WritingAdminSummary {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      publishStatus: row.publishStatus,
      updatedAt: row.updatedAt.toISOString(),
      ...(row.readingTimeMinutes != null
        ? { readingTimeMinutes: row.readingTimeMinutes }
        : {}),
      tags: row.tags,
    };
  }

  mapAdmin(row: ArticleRow): ArticleAdminResponse {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      body: row.body,
      tags: row.tags,
      seriesId: row.seriesId,
      seriesSortOrder: row.seriesSortOrder,
      coverMediaId: row.coverMediaId,
      byline: row.byline,
      readingTimeMinutes: row.readingTimeMinutes,
      wordCount: row.wordCount,
      featuredOnHub: row.featuredOnHub,
      featured: row.featured,
      sortOrder: row.sortOrder,
      materiallyUpdatedAt: row.materiallyUpdatedAt?.toISOString() ?? null,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      hideFromSearch: row.hideFromSearch,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCreateInput(body: CreateArticleBody): CreateArticleInput {
    return { ...body };
  }

  private toUpdateInput(body: UpdateArticleBody): UpdateArticleInput {
    return { ...body };
  }

  async list(query: ListWritingQuery) {
    const result = await this.writing.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
      tag: query.tag,
      seriesId: query.seriesId,
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });
    return {
      items: result.items.map((row) => this.mapSummary(row)),
      meta: result.meta,
    };
  }

  async get(id: string) {
    const row = await this.writing.findByIdAdmin(id);
    return this.mapAdmin(row);
  }

  async create(body: CreateArticleBody) {
    const row = await this.writing.create(this.toCreateInput(body));
    return this.mapAdmin(row);
  }

  async update(id: string, body: UpdateArticleBody) {
    const row = await this.writing.update(id, this.toUpdateInput(body));
    return this.mapAdmin(row);
  }

  async preview(id: string) {
    return await this.publicWriting.previewById(id);
  }

  async getPublishCheck(id: string) {
    return await this.writing.getPublishChecklist(id);
  }

  async publish(id: string, body: PublishArticleBody) {
    const row = await this.writing.publish(id, body);
    return this.mapAdmin(row);
  }

  async unpublish(id: string) {
    const row = await this.writing.unpublish(id);
    return this.mapAdmin(row);
  }

  async archive(id: string) {
    const row = await this.writing.archive(id);
    return this.mapAdmin(row);
  }

  async schedule(id: string, scheduledAt: Date) {
    const row = await this.writing.schedule(id, scheduledAt);
    return this.mapAdmin(row);
  }

  async getRelations(id: string) {
    return await this.writing.getArticleRelations(id);
  }

  async putRelations(
    id: string,
    body: {
      publicationIds?: string[];
      projectIds?: string[];
      themeIds?: string[];
      relatedArticleIds?: string[];
    },
  ) {
    return await this.writing.replaceArticleRelations(id, body);
  }
}
