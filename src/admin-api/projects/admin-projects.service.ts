import { Injectable } from '@nestjs/common';
import { ProjectsService } from '../../domain/projects/projects.service';
import type { ProjectRow } from '../../domain/projects/projects.types';
import type { ListProjectsQuery } from './dto/list-projects-query.dto';
import type { ProjectAdminResponse } from './dto/project-admin-response.dto';

@Injectable()
export class AdminProjectsService {
  constructor(private readonly projects: ProjectsService) {}

  private mapAdmin(row: ProjectRow): ProjectAdminResponse {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      tags: row.tags,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(query: ListProjectsQuery) {
    const rows = await this.projects.listAdmin(query);
    return rows.map((row) => this.mapAdmin(row));
  }

  async get(id: string) {
    return this.mapAdmin(await this.projects.findByIdAdmin(id));
  }
}
