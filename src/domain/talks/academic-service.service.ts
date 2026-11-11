import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lte,
  or,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  buildPaginatedResponse,
  type PaginatedResponse,
} from '../../common/pagination/paginated-response';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { academicServiceEntries } from '../../db/schema/talks/academic-service-entries';
import { academicServicePublishChecklist } from './academic-service-publish-checklist';
import { trimTalkOptional } from './talk-child-inputs';
import type {
  AcademicServiceEntryRow,
  AcademicServicePublicRow,
  AcademicServiceType,
  CreateAcademicServiceInput,
  ListAdminAcademicServiceQuery,
  ListAdminAcademicServiceSort,
  PublishTalkOptions,
  UpdateAcademicServiceInput,
} from './talks.types';

const DEFAULT_ADMIN_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;

function academicServiceVisibleSql(now: Date): SQL {
  return or(
    eq(academicServiceEntries.publishStatus, 'published'),
    and(
      eq(academicServiceEntries.publishStatus, 'scheduled'),
      lte(academicServiceEntries.scheduledAt, now),
    ),
  )!;
}

@Injectable()
export class AcademicServiceService {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  private orderByForAdminList(sort?: ListAdminAcademicServiceSort) {
    switch (sort ?? 'updatedAtDesc') {
      case 'sortOrderAsc':
        return [
          asc(academicServiceEntries.sortOrder),
          asc(academicServiceEntries.organization),
        ];
      case 'startYearDesc':
        return [
          desc(academicServiceEntries.startYear),
          asc(academicServiceEntries.organization),
        ];
      case 'updatedAtDesc':
      default:
        return [desc(academicServiceEntries.updatedAt)];
    }
  }

  toPublicRow(row: AcademicServiceEntryRow): AcademicServicePublicRow {
    return {
      serviceType: row.serviceType,
      organization: row.organization,
      roleTitle: row.roleTitle,
      startYear: row.startYear,
      endYear: row.endYear,
      proofUrl: row.proofUrl,
      summary: row.summary,
    };
  }

  async listAdmin(
    query: ListAdminAcademicServiceQuery = {},
  ): Promise<PaginatedResponse<AcademicServiceEntryRow>> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_ADMIN_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(academicServiceEntries.organization, pattern),
          ilike(academicServiceEntries.roleTitle, pattern),
          ilike(academicServiceEntries.summary, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(
        eq(academicServiceEntries.publishStatus, query.publishStatus),
      );
    }
    if (query.serviceType) {
      conditions.push(
        eq(academicServiceEntries.serviceType, query.serviceType),
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(academicServiceEntries)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(academicServiceEntries)
      .where(whereClause)
      .orderBy(...this.orderByForAdminList(query.sort))
      .limit(limit)
      .offset(offset);

    return buildPaginatedResponse(items, {
      page,
      limit,
      total: Number(countRow?.total ?? 0),
    });
  }

  async create(
    input: CreateAcademicServiceInput,
  ): Promise<AcademicServiceEntryRow> {
    const [row] = await this.db
      .insert(academicServiceEntries)
      .values({
        organization: input.organization.trim(),
        roleTitle: input.roleTitle.trim(),
        serviceType: input.serviceType ?? 'other',
        startYear: input.startYear ?? null,
        endYear: input.endYear ?? null,
        proofUrl: trimTalkOptional(input.proofUrl),
        summary: trimTalkOptional(input.summary),
        sortOrder: input.sortOrder ?? 0,
        publishStatus: 'draft',
      })
      .returning();
    if (!row) {
      throw new Error('Failed to create academic service entry');
    }
    return row;
  }

  async update(
    id: string,
    input: UpdateAcademicServiceInput,
  ): Promise<AcademicServiceEntryRow> {
    await this.findByIdAdmin(id);
    const patch: Record<string, unknown> = {};
    if (input.organization !== undefined) {
      patch.organization = input.organization.trim();
    }
    if (input.roleTitle !== undefined) patch.roleTitle = input.roleTitle.trim();
    if (input.serviceType !== undefined) patch.serviceType = input.serviceType;
    if (input.startYear !== undefined) patch.startYear = input.startYear;
    if (input.endYear !== undefined) patch.endYear = input.endYear;
    if (input.proofUrl !== undefined) {
      patch.proofUrl = trimTalkOptional(input.proofUrl);
    }
    if (input.summary !== undefined) {
      patch.summary = trimTalkOptional(input.summary);
    }
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.publishStatus !== undefined) {
      patch.publishStatus = input.publishStatus;
    }

    const [row] = await this.db
      .update(academicServiceEntries)
      .set(patch)
      .where(eq(academicServiceEntries.id, id))
      .returning();
    if (!row) {
      throw new NotFoundException('Academic service entry not found');
    }
    return row;
  }

  async findByIdAdmin(id: string): Promise<AcademicServiceEntryRow> {
    const [row] = await this.db
      .select()
      .from(academicServiceEntries)
      .where(eq(academicServiceEntries.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Academic service entry not found');
    }
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdAdmin(id);
    await this.db
      .delete(academicServiceEntries)
      .where(eq(academicServiceEntries.id, id));
  }

  async listPublishedPublic(now = new Date()): Promise<AcademicServicePublicRow[]> {
    const rows = await this.db
      .select()
      .from(academicServiceEntries)
      .where(academicServiceVisibleSql(now))
      .orderBy(
        asc(academicServiceEntries.sortOrder),
        desc(academicServiceEntries.startYear),
        asc(academicServiceEntries.organization),
      );

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .map((row) => this.toPublicRow(row));
  }

  async countPublished(now = new Date()): Promise<number> {
    const rows = await this.db
      .select()
      .from(academicServiceEntries)
      .where(academicServiceVisibleSql(now));
    return rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      ),
    ).length;
  }

  async getPublishChecklist(id: string) {
    const row = await this.findByIdAdmin(id);
    return academicServicePublishChecklist(row);
  }

  private async assertCanPublish(
    id: string,
    options: PublishTalkOptions = {},
  ): Promise<void> {
    const checklist = await this.getPublishChecklist(id);
    if (checklist.errors.length > 0) {
      throw new BadRequestException({
        message: checklist.errors.map((item) => item.message).join('; '),
        code: 'PUBLISH_BLOCKED',
        checklist,
      });
    }
    if (checklist.warnings.length > 0 && !options.confirmWarnings) {
      throw new BadRequestException({
        message: 'Confirm publish warnings before continuing',
        code: 'PUBLISH_WARNINGS',
        checklist,
      });
    }
  }

  async publish(
    id: string,
    options: PublishTalkOptions = {},
  ): Promise<AcademicServiceEntryRow> {
    await this.assertCanPublish(id, options);
    const now = new Date();
    const [updated] = await this.db
      .update(academicServiceEntries)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(academicServiceEntries.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Academic service entry not found');
    }
    return updated;
  }

  async unpublish(id: string): Promise<AcademicServiceEntryRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(academicServiceEntries)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
      .where(eq(academicServiceEntries.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Academic service entry not found');
    }
    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    options: PublishTalkOptions = {},
  ): Promise<AcademicServiceEntryRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    await this.assertCanPublish(id, options);
    const [updated] = await this.db
      .update(academicServiceEntries)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(academicServiceEntries.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Academic service entry not found');
    }
    return updated;
  }

  async archive(id: string): Promise<AcademicServiceEntryRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(academicServiceEntries)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(academicServiceEntries.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Academic service entry not found');
    }
    return updated;
  }
}
