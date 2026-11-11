import { Injectable } from '@nestjs/common';
import { AcademicServiceService } from '../../domain/talks/academic-service.service';
import type {
  AcademicServiceEntryRow,
  CreateAcademicServiceInput,
  UpdateAcademicServiceInput,
} from '../../domain/talks/talks.types';
import type { AcademicServiceAdminDetail } from './dto/academic-service-admin-detail.dto';
import type { AcademicServiceAdminSummary } from './dto/academic-service-admin-summary.dto';
import type { CreateAcademicServiceBody } from './dto/create-academic-service.dto';
import type { ListAcademicServiceQuery } from './dto/list-academic-service-query.dto';
import type { UpdateAcademicServiceBody } from './dto/update-academic-service.dto';

@Injectable()
export class AdminAcademicServiceService {
  constructor(private readonly academicService: AcademicServiceService) {}

  private mapSummary(row: AcademicServiceEntryRow): AcademicServiceAdminSummary {
    return {
      id: row.id,
      organization: row.organization,
      roleTitle: row.roleTitle,
      serviceType: row.serviceType,
      publishStatus: row.publishStatus,
      sortOrder: row.sortOrder,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  mapAdmin(row: AcademicServiceEntryRow): AcademicServiceAdminDetail {
    return {
      id: row.id,
      serviceType: row.serviceType,
      organization: row.organization,
      roleTitle: row.roleTitle,
      startYear: row.startYear,
      endYear: row.endYear,
      proofUrl: row.proofUrl,
      summary: row.summary,
      sortOrder: row.sortOrder,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toCreateInput(
    body: CreateAcademicServiceBody,
  ): CreateAcademicServiceInput {
    return { ...body };
  }

  private toUpdateInput(
    body: UpdateAcademicServiceBody,
  ): UpdateAcademicServiceInput {
    return { ...body };
  }

  async list(query: ListAcademicServiceQuery) {
    const result = await this.academicService.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
      serviceType: query.serviceType,
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
    const row = await this.academicService.findByIdAdmin(id);
    return this.mapAdmin(row);
  }

  async create(body: CreateAcademicServiceBody) {
    const row = await this.academicService.create(this.toCreateInput(body));
    return this.mapAdmin(row);
  }

  async update(id: string, body: UpdateAcademicServiceBody) {
    const row = await this.academicService.update(
      id,
      this.toUpdateInput(body),
    );
    return this.mapAdmin(row);
  }

  async delete(id: string) {
    await this.academicService.delete(id);
  }

  async publishCheck(id: string) {
    return await this.academicService.getPublishChecklist(id);
  }

  async publish(id: string, body: { confirmWarnings?: boolean }) {
    const row = await this.academicService.publish(id, body);
    return this.mapAdmin(row);
  }

  async unpublish(id: string) {
    const row = await this.academicService.unpublish(id);
    return this.mapAdmin(row);
  }

  async schedule(
    id: string,
    body: { scheduledAt: string; confirmWarnings?: boolean },
  ) {
    const row = await this.academicService.schedule(
      id,
      new Date(body.scheduledAt),
      { confirmWarnings: body.confirmWarnings },
    );
    return this.mapAdmin(row);
  }

  async archive(id: string) {
    const row = await this.academicService.archive(id);
    return this.mapAdmin(row);
  }
}
