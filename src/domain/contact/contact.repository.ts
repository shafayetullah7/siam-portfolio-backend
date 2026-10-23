import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  count,
  desc,
  eq,
  ilike,
  ne,
  or,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { buildPaginatedResponse } from '../../common/pagination/paginated-response';
import type { PaginatedResponse } from '../../common/pagination/paginated-response';
import { contactMessages } from '../../db/schema/contact/contact-messages';
import type {
  ContactMessageInsert,
  ContactMessageListQuery,
  ContactMessageRow,
  ContactMessageUpdate,
} from './contact.types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ContactRepository {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
  ) {}

  async insert(
    values: ContactMessageInsert,
  ): Promise<ContactMessageRow> {
    const [row] = await this.db
      .insert(contactMessages)
      .values(values)
      .returning();
    if (!row) {
      throw new Error('Failed to insert contact message');
    }
    return row;
  }

  async findById(id: string): Promise<ContactMessageRow | null> {
    const [row] = await this.db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByIdOrThrow(id: string): Promise<ContactMessageRow> {
    const row = await this.findById(id);
    if (!row) {
      throw new NotFoundException('Message not found');
    }
    return row;
  }

  private buildListWhere(query: ContactMessageListQuery): SQL | undefined {
    const parts: SQL[] = [];
    if (query.status !== undefined) {
      parts.push(eq(contactMessages.status, query.status));
    }
    if (query.isRead !== undefined) {
      parts.push(eq(contactMessages.isRead, query.isRead));
    }
    if (query.excludeSpam) {
      parts.push(ne(contactMessages.status, 'spam'));
    }
    if (query.category !== undefined) {
      parts.push(eq(contactMessages.category, query.category));
    }
    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      parts.push(
        or(
          ilike(contactMessages.senderName, pattern),
          ilike(contactMessages.senderEmail, pattern),
        )!,
      );
    }
    if (parts.length === 0) return undefined;
    return and(...parts);
  }

  async list(
    query: ContactMessageListQuery = {},
  ): Promise<PaginatedResponse<ContactMessageRow>> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, query.limit ?? DEFAULT_LIMIT),
    );
    const offset = (page - 1) * limit;
    const where = this.buildListWhere(query);

    const countQuery = this.db
      .select({ value: count() })
      .from(contactMessages);
    const listQuery = this.db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.submittedAt))
      .limit(limit)
      .offset(offset);

    const [{ value: total }] = where
      ? await countQuery.where(where)
      : await countQuery;
    const rows = where ? await listQuery.where(where) : await listQuery;

    return buildPaginatedResponse(rows, { page, limit, total });
  }

  async update(
    id: string,
    patch: ContactMessageUpdate,
  ): Promise<ContactMessageRow> {
    const [row] = await this.db
      .update(contactMessages)
      .set(patch)
      .where(eq(contactMessages.id, id))
      .returning();
    if (!row) {
      throw new NotFoundException('Message not found');
    }
    return row;
  }

  async delete(id: string): Promise<void> {
    const [row] = await this.db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id });
    if (!row) {
      throw new NotFoundException('Message not found');
    }
  }
}
