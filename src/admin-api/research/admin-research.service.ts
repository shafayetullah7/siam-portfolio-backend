import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ResearchService } from '../../domain/research/research.service';
import { PublicResearchService } from '../../public-api/research/public-research.service';
import type { ResearchThemeRow } from '../../domain/research/research.types';
import type { CreateResearchThemeBody } from './dto/create-research-theme.dto';
import type { ListResearchQuery } from './dto/list-research-query.dto';
import type { ResearchThemeAdminResponse } from './dto/research-theme-admin-response.dto';
import type { PublishResearchThemeBody } from './dto/publish-research-theme.dto';
import type { UpdateResearchThemeBody } from './dto/update-research-theme.dto';

@Injectable()
export class AdminResearchService {
  constructor(
    private readonly research: ResearchService,
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
    private readonly publicResearch: PublicResearchService,
  ) {}

  private async mapAdmin(
    row: ResearchThemeRow,
  ): Promise<ResearchThemeAdminResponse> {
    const resources = await this.research.listResources(row.id);
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      themeStatus: row.themeStatus,
      problem: row.problem,
      significance: row.significance,
      objectives: row.objectives,
      approach: row.approach,
      findings: row.findings,
      limitations: row.limitations,
      futureWork: row.futureWork,
      tags: row.tags,
      linkLabel: row.linkLabel,
      coverMediaId: row.coverMediaId,
      sortOrder: row.sortOrder,
      featuredOnHome: row.featuredOnHome,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      collaborators:
        row.collaborators?.map((c) => ({
          name: c.name,
          role: c.role ?? null,
          url: c.url ?? null,
        })) ?? null,
      acknowledgments: row.acknowledgments,
      funding: row.funding,
      resources: resources.map((r) => ({
        id: r.id,
        label: r.label,
        url: r.url,
        resourceType: r.resourceType,
        sortOrder: r.sortOrder,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(query: ListResearchQuery) {
    const rows = await this.research.listAdmin(query);
    return Promise.all(rows.map((row) => this.mapAdmin(row)));
  }

  async create(input: CreateResearchThemeBody) {
    return this.mapAdmin(await this.research.create(input));
  }

  async get(id: string) {
    return this.mapAdmin(await this.research.findByIdAdmin(id));
  }

  preview(id: string) {
    return this.publicResearch.previewById(id);
  }

  async update(id: string, input: UpdateResearchThemeBody) {
    return this.mapAdmin(await this.research.update(id, input));
  }

  async getPublishCheck(id: string) {
    return await this.research.getPublishChecklist(id);
  }

  async publish(id: string, body: PublishResearchThemeBody = {}) {
    return this.mapAdmin(
      await this.research.publish(id, {
        confirmWarnings: body.confirmWarnings,
      }),
    );
  }

  async unpublish(id: string) {
    return this.mapAdmin(await this.research.unpublish(id));
  }

  async archive(id: string) {
    return this.mapAdmin(await this.research.archive(id));
  }

  async schedule(id: string, scheduledAt: Date) {
    return this.mapAdmin(await this.research.schedule(id, scheduledAt));
  }

  async listRevisions(id: string) {
    const rows = await this.research.listRevisions(id);
    return rows.map((row) => ({
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      snapshot: row.snapshot,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async restore(id: string, revisionId: string) {
    return this.mapAdmin(await this.research.restoreRevision(id, revisionId));
  }

  async getPublications(themeId: string) {
    await this.research.findByIdAdmin(themeId);
    const ids = await this.research.listPublicationIdsForTheme(themeId);
    const rows = await this.publications.findManyByIds(ids);
    return rows.map((row, index) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      authorsShort: row.authorsShort,
      year: row.year,
      venue: row.venue,
      publishStatus: row.publishStatus,
      sortOrder: index,
    }));
  }

  async putPublications(
    themeId: string,
    publicationIds: string[],
  ) {
    await this.research.replacePublications(themeId, publicationIds);
    return this.getPublications(themeId);
  }

  async getProjects(themeId: string) {
    await this.research.findByIdAdmin(themeId);
    const ids = await this.research.listProjectIdsForTheme(themeId);
    const rows = await this.projects.findManyByIds(ids);
    return rows.map((row, index) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags,
      publishStatus: row.publishStatus,
      sortOrder: index,
    }));
  }

  async putProjects(themeId: string, projectIds: string[]) {
    await this.research.replaceProjects(themeId, projectIds);
    return this.getProjects(themeId);
  }
}
