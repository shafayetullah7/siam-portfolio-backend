import { Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '../../common/pagination/paginated-response';
import { ContactService } from '../../domain/contact/contact.service';
import type { AdminContactMessageListQuery } from '../../domain/contact/contact.types';
import type { ListMessagesQuery } from './dto/list-messages-query.dto';
import type {
  MessageAdminDetail,
  MessageAdminListItem,
} from './dto/message-admin-response.dto';
import type { BulkUpdateMessagesBody } from './dto/bulk-update-messages-body.dto';
import type { UpdateMessageBody } from './dto/update-message-body.dto';
import {
  toMessageAdminDetail,
  toMessageAdminListItem,
} from './message-admin.mapper';

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

@Injectable()
export class AdminMessagesService {
  constructor(private readonly contact: ContactService) {}

  private toListQuery(query: ListMessagesQuery): AdminContactMessageListQuery {
    const excludeSpam =
      query.status === 'spam' ? false : (query.excludeSpam ?? true);
    return {
      status: query.status,
      isRead: query.isRead,
      category: query.category,
      q: query.q,
      from: query.from ? startOfUtcDay(query.from) : undefined,
      to: query.to ? endOfUtcDay(query.to) : undefined,
      page: query.page,
      limit: query.limit,
      excludeSpam,
    };
  }

  async list(
    query: ListMessagesQuery,
  ): Promise<PaginatedResponse<MessageAdminListItem>> {
    const result = await this.contact.listInbox(this.toListQuery(query));
    return {
      items: result.items.map(toMessageAdminListItem),
      meta: result.meta,
    };
  }

  async get(id: string): Promise<MessageAdminDetail> {
    const row = await this.contact.findByIdAdmin(id);
    return toMessageAdminDetail(row);
  }

  async update(id: string, body: UpdateMessageBody): Promise<MessageAdminDetail> {
    const row = await this.contact.updateMessage(id, body);
    return toMessageAdminDetail(row);
  }

  async delete(id: string): Promise<void> {
    await this.contact.deleteMessage(id);
  }

  async bulkUpdate(body: BulkUpdateMessagesBody): Promise<{ updated: number }> {
    return await this.contact.bulkUpdateMessages(body.ids, body.patch);
  }
}
