import { Injectable } from '@nestjs/common';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicProjectsService } from '../../public-api/projects/public-projects.service';
import type {
  CreateProjectInput,
  ProjectMetricRow,
  ProjectResourceRow,
  ProjectRow,
  ProjectSectionRow,
  UpdateProjectInput,
} from '../../domain/projects/projects.types';
import type { CreateProjectBody } from './dto/create-project.dto';
import type { ListProjectsQuery } from './dto/list-projects-query.dto';
import type { ProjectAdminResponse } from './dto/project-admin-response.dto';
import type { PublishProjectBody } from './dto/publish-project.dto';
import type { UpdateProjectBody } from './dto/update-project.dto';

@Injectable()
export class AdminProjectsService {
  constructor(
    private readonly projects: ProjectsService,
    private readonly publications: PublicationsService,
    private readonly publicProjects: PublicProjectsService,
  ) {}

  private mapAdminBase(
    row: ProjectRow,
  ): Omit<
    ProjectAdminResponse,
    'sections' | 'resources' | 'metrics'
  > {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags,
      projectType: row.projectType,
      projectStatus: row.projectStatus,
      evaluationMaturity: row.evaluationMaturity,
      ownerRole: row.ownerRole,
      ownerContribution: row.ownerContribution,
      resultTeaser: row.resultTeaser,
      periodStart: row.periodStart ?? null,
      periodEnd: row.periodEnd ?? null,
      coverMediaId: row.coverMediaId,
      featured: row.featured,
      featuredOnHome: row.featuredOnHome,
      sortOrder: row.sortOrder,
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

  private mapAdmin(
    row: ProjectRow,
    sectionRows: ProjectSectionRow[] = [],
    resourceRows: ProjectResourceRow[] = [],
    metricRows: ProjectMetricRow[] = [],
  ): ProjectAdminResponse {
    return {
      ...this.mapAdminBase(row),
      sections: this.projects.mapSectionsToAdmin(sectionRows),
      resources: this.projects.mapResourcesToAdmin(resourceRows),
      metrics: this.projects.mapMetricsToAdmin(metricRows),
    };
  }

  private async mapAdminWithChildren(row: ProjectRow): Promise<ProjectAdminResponse> {
    const [sections, resources, metrics] = await Promise.all([
      this.projects.loadSectionsForProject(row.id),
      this.projects.loadResourcesForProject(row.id),
      this.projects.loadMetricsForProject(row.id),
    ]);
    const mediaBySection = await this.projects.loadSectionMediaIdsBySectionIds(
      sections.map((s) => s.id),
    );
    return {
      ...this.mapAdminBase(row),
      sections: this.projects.mapSectionsToAdmin(sections, mediaBySection),
      resources: this.projects.mapResourcesToAdmin(resources),
      metrics: this.projects.mapMetricsToAdmin(metrics),
    };
  }

  private toCreateInput(body: CreateProjectBody): CreateProjectInput {
    return { ...body };
  }

  private toUpdateInput(body: UpdateProjectBody): UpdateProjectInput {
    return { ...body };
  }

  async list(query: ListProjectsQuery) {
    const rows = await this.projects.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
      projectType: query.projectType,
      featured: query.featured,
      limit: query.limit,
    });
    return rows.map((row) =>
      this.mapAdmin(row, [], [], []),
    );
  }

  async get(id: string) {
    const row = await this.projects.findByIdAdmin(id);
    return await this.mapAdminWithChildren(row);
  }

  async create(body: CreateProjectBody) {
    const row = await this.projects.create(this.toCreateInput(body));
    return await this.mapAdminWithChildren(row);
  }

  async update(id: string, body: UpdateProjectBody) {
    const row = await this.projects.update(id, this.toUpdateInput(body));
    return await this.mapAdminWithChildren(row);
  }

  async preview(id: string) {
    const base = await this.projects.previewForAdmin(id);
    return await this.publicProjects.enrichPublicDetail(id, base);
  }

  async getPublications(projectId: string) {
    await this.projects.findByIdAdmin(projectId);
    const ids = await this.projects.listPublicationIdsForProject(projectId);
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

  async putPublications(projectId: string, publicationIds: string[]) {
    await this.projects.replacePublications(projectId, publicationIds);
    return this.getPublications(projectId);
  }

  async getPublishCheck(id: string) {
    return await this.projects.getPublishChecklist(id);
  }

  async publish(id: string, body: PublishProjectBody = {}) {
    const row = await this.projects.publish(id, {
      confirmWarnings: body.confirmWarnings,
    });
    return await this.mapAdminWithChildren(row);
  }

  async unpublish(id: string) {
    const row = await this.projects.unpublish(id);
    return await this.mapAdminWithChildren(row);
  }

  async archive(id: string) {
    const row = await this.projects.archive(id);
    return await this.mapAdminWithChildren(row);
  }

  async schedule(id: string, scheduledAt: Date) {
    const row = await this.projects.schedule(id, scheduledAt);
    return await this.mapAdminWithChildren(row);
  }
}
