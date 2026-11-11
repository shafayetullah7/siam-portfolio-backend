import { Injectable } from '@nestjs/common';
import { CollaborationsService } from '../../domain/talks/collaborations.service';
import type {
  CollaborationRow,
  CreateCollaborationInput,
  UpdateCollaborationInput,
} from '../../domain/talks/talks.types';
import type { CollaborationAdminDetail } from './dto/collaboration-admin-detail.dto';
import type { CollaborationAdminSummary } from './dto/collaboration-admin-summary.dto';
import type { CreateCollaborationBody } from './dto/create-collaboration.dto';
import type { ListCollaborationsQuery } from './dto/list-collaborations-query.dto';
import type { UpdateCollaborationBody } from './dto/update-collaboration.dto';

@Injectable()
export class AdminCollaborationsService {
  constructor(private readonly collaborations: CollaborationsService) {}

  private mapSummary(row: CollaborationRow): CollaborationAdminSummary {
    return {
      id: row.id,
      partnerName: row.partnerName,
      institution: row.institution,
      publishStatus: row.publishStatus,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  mapAdmin(row: CollaborationRow): CollaborationAdminDetail {
    return {
      id: row.id,
      partnerName: row.partnerName,
      institution: row.institution,
      logoMediaId: row.logoMediaId,
      role: row.role,
      period: row.period,
      summary: row.summary,
      outcomes: row.outcomes,
      sortOrder: row.sortOrder,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCreateInput(body: CreateCollaborationBody): CreateCollaborationInput {
    return { ...body };
  }

  private toUpdateInput(body: UpdateCollaborationBody): UpdateCollaborationInput {
    return { ...body };
  }

  async list(query: ListCollaborationsQuery) {
    const result = await this.collaborations.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
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
    const row = await this.collaborations.findByIdAdmin(id);
    return this.mapAdmin(row);
  }

  async create(body: CreateCollaborationBody) {
    const row = await this.collaborations.create(this.toCreateInput(body));
    return this.mapAdmin(row);
  }

  async update(id: string, body: UpdateCollaborationBody) {
    const row = await this.collaborations.update(
      id,
      this.toUpdateInput(body),
    );
    return this.mapAdmin(row);
  }

  async delete(id: string) {
    await this.collaborations.delete(id);
  }

  async publishCheck(id: string) {
    return await this.collaborations.getPublishChecklist(id);
  }

  async publish(id: string, body: { confirmWarnings?: boolean }) {
    const row = await this.collaborations.publish(id, body);
    return this.mapAdmin(row);
  }

  async unpublish(id: string) {
    const row = await this.collaborations.unpublish(id);
    return this.mapAdmin(row);
  }

  async schedule(
    id: string,
    body: { scheduledAt: string; confirmWarnings?: boolean },
  ) {
    const row = await this.collaborations.schedule(
      id,
      new Date(body.scheduledAt),
      { confirmWarnings: body.confirmWarnings },
    );
    return this.mapAdmin(row);
  }

  async archive(id: string) {
    const row = await this.collaborations.archive(id);
    return this.mapAdmin(row);
  }
}
