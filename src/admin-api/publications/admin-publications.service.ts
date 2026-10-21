import { Injectable } from '@nestjs/common';
import { PublicationsService } from '../../domain/publications/publications.service';
import type { PublicationRow } from '../../domain/publications/publications.types';
import type { ListPublicationsQuery } from './dto/list-publications-query.dto';
import type { PublicationAdminResponse } from './dto/publication-admin-response.dto';

@Injectable()
export class AdminPublicationsService {
  constructor(private readonly publications: PublicationsService) {}

  private mapAdmin(row: PublicationRow): PublicationAdminResponse {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      authorsShort: row.authorsShort,
      year: row.year,
      venue: row.venue,
      significance: row.significance,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(query: ListPublicationsQuery) {
    const rows = await this.publications.listAdmin(query);
    return rows.map((row) => this.mapAdmin(row));
  }

  async get(id: string) {
    return this.mapAdmin(await this.publications.findByIdAdmin(id));
  }
}
