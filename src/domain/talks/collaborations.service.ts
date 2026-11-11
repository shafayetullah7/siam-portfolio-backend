import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { collaborations } from '../../db/schema/talks/collaborations';
import { MediaService } from '../media/media.service';
import { collaborationPublishChecklist } from './collaboration-publish-checklist';
import { trimTalkOptional } from './talk-child-inputs';
import type {
  CollaborationPublicCard,
  CollaborationRow,
  CreateCollaborationInput,
  ListAdminCollaborationsQuery,
  ListAdminCollaborationsSort,
  PublishTalkOptions,
  UpdateCollaborationInput,
} from './talks.types';

const DEFAULT_ADMIN_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

function collaborationVisibleSql(now: Date): SQL {
  return or(
    eq(collaborations.publishStatus, 'published'),
    and(
      eq(collaborations.publishStatus, 'scheduled'),
      lte(collaborations.scheduledAt, now),
    ),
  )!;
}

@Injectable()
export class CollaborationsService {
  constructor(
    @InjectDrizzle() private readonly db: NodePgDatabase,
    private readonly media: MediaService,
  ) {}

  private async resolveLogoMediaId(
    logoMediaId: string | null | undefined,
  ): Promise<string | null | undefined> {
    if (logoMediaId === undefined) return undefined;
    if (logoMediaId === null) return null;
    await this.media.assertImageMediaId(logoMediaId);
    return logoMediaId;
  }

  toPublicCard(row: CollaborationRow): CollaborationPublicCard {
    return {
      partnerName: row.partnerName,
      institution: row.institution,
      role: row.role,
      period: row.period,
      summary: row.summary,
      outcomes: row.outcomes,
      logo: null,
    };
  }

  private orderByForAdminList(sort?: ListAdminCollaborationsSort) {
    switch (sort ?? 'updatedAtDesc') {
      case 'sortOrderAsc':
        return [asc(collaborations.sortOrder), asc(collaborations.partnerName)];
      case 'partnerNameAsc':
        return [asc(collaborations.partnerName), desc(collaborations.updatedAt)];
      case 'updatedAtDesc':
      default:
        return [desc(collaborations.updatedAt), asc(collaborations.sortOrder)];
    }
  }

  async listAdmin(
    query: ListAdminCollaborationsQuery = {},
  ): Promise<PaginatedResponse<CollaborationRow>> {
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
          ilike(collaborations.partnerName, pattern),
          ilike(collaborations.institution, pattern),
          ilike(collaborations.summary, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(collaborations.publishStatus, query.publishStatus));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [countRow] = await this.db
      .select({ total: count() })
      .from(collaborations)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(collaborations)
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

  async create(input: CreateCollaborationInput): Promise<CollaborationRow> {
    const logoMediaId = await this.resolveLogoMediaId(input.logoMediaId);
    const [row] = await this.db
      .insert(collaborations)
      .values({
        partnerName: input.partnerName.trim(),
        summary: input.summary.trim(),
        institution: trimTalkOptional(input.institution),
        logoMediaId: logoMediaId ?? null,
        role: trimTalkOptional(input.role),
        period: trimTalkOptional(input.period),
        outcomes: trimTalkOptional(input.outcomes),
        sortOrder: input.sortOrder ?? 0,
        publishStatus: 'draft',
      })
      .returning();
    if (!row) {
      throw new Error('Failed to create collaboration');
    }
    return row;
  }

  async update(
    id: string,
    input: UpdateCollaborationInput,
  ): Promise<CollaborationRow> {
    await this.findByIdAdmin(id);
    const patch: Record<string, unknown> = {};
    if (input.partnerName !== undefined) {
      patch.partnerName = input.partnerName.trim();
    }
    if (input.summary !== undefined) patch.summary = input.summary.trim();
    if (input.institution !== undefined) {
      patch.institution = trimTalkOptional(input.institution);
    }
    if (input.logoMediaId !== undefined) {
      patch.logoMediaId = await this.resolveLogoMediaId(input.logoMediaId);
    }
    if (input.role !== undefined) patch.role = trimTalkOptional(input.role);
    if (input.period !== undefined) patch.period = trimTalkOptional(input.period);
    if (input.outcomes !== undefined) {
      patch.outcomes = trimTalkOptional(input.outcomes);
    }
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.publishStatus !== undefined) {
      patch.publishStatus = input.publishStatus;
    }

    try {
      const [row] = await this.db
        .update(collaborations)
        .set(patch)
        .where(eq(collaborations.id, id))
        .returning();
      if (!row) {
        throw new NotFoundException('Collaboration not found');
      }
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Update conflict');
      }
      throw error;
    }
  }

  async findByIdAdmin(id: string): Promise<CollaborationRow> {
    const [row] = await this.db
      .select()
      .from(collaborations)
      .where(eq(collaborations.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Collaboration not found');
    }
    return row;
  }

  async delete(id: string): Promise<void> {
    await this.findByIdAdmin(id);
    await this.db.delete(collaborations).where(eq(collaborations.id, id));
  }

  async listPublishedRowsForPublic(now = new Date()): Promise<CollaborationRow[]> {
    const rows = await this.db
      .select()
      .from(collaborations)
      .where(collaborationVisibleSql(now))
      .orderBy(asc(collaborations.sortOrder), asc(collaborations.partnerName));

    return rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      ),
    );
  }

  async listPublishedPublic(now = new Date()): Promise<CollaborationPublicCard[]> {
    const rows = await this.listPublishedRowsForPublic(now);
    return rows.map((row) => this.toPublicCard(row));
  }

  async countPublished(now = new Date()): Promise<number> {
    const rows = await this.listPublishedRowsForPublic(now);
    return rows.length;
  }

  async getPublishChecklist(id: string) {
    const row = await this.findByIdAdmin(id);
    let logoAlt: string | null = null;
    let logoMediaMissing = false;
    if (row.logoMediaId) {
      try {
        const media = await this.media.findById(row.logoMediaId);
        logoAlt = media.alt;
      } catch (error) {
        if (error instanceof NotFoundException) {
          logoMediaMissing = true;
        } else {
          throw error;
        }
      }
    }
    return collaborationPublishChecklist(row, { logoAlt, logoMediaMissing });
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
  ): Promise<CollaborationRow> {
    await this.assertCanPublish(id, options);
    const now = new Date();
    const [updated] = await this.db
      .update(collaborations)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(collaborations.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Collaboration not found');
    }
    return updated;
  }

  async unpublish(id: string): Promise<CollaborationRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(collaborations)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
      .where(eq(collaborations.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Collaboration not found');
    }
    return updated;
  }

  async schedule(
    id: string,
    scheduledAt: Date,
    options: PublishTalkOptions = {},
  ): Promise<CollaborationRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    await this.assertCanPublish(id, options);
    const [updated] = await this.db
      .update(collaborations)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(collaborations.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Collaboration not found');
    }
    return updated;
  }

  async archive(id: string): Promise<CollaborationRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(collaborations)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(collaborations.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Collaboration not found');
    }
    return updated;
  }
}
