import {
  INestApplication,
  NotFoundException,
  StandardSchemaValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminMessagesController } from '../src/admin-api/messages/admin-messages.controller';
import { AdminMessagesService } from '../src/admin-api/messages/admin-messages.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { AdminAuthGuard } from '../src/common/guards/admin-auth.guard';
import { ApiEnvelopeInterceptor } from '../src/common/interceptors/api-envelope.interceptor';
import { buildPaginatedResponse } from '../src/common/pagination/paginated-response';
import { ContactService } from '../src/domain/contact/contact.service';
import type { ContactMessageRow } from '../src/domain/contact/contact.types';

const MESSAGE_ID = '00000000-0000-4000-8000-000000000099';

function messageRow(overrides?: Partial<ContactMessageRow>): ContactMessageRow {
  return {
    id: MESSAGE_ID,
    status: 'new',
    isRead: false,
    category: 'Collaboration',
    senderName: 'Ada',
    senderEmail: 'ada@example.com',
    affiliation: 'Lab',
    subject: null,
    body: 'Hello world! '.repeat(30),
    consentGiven: true,
    consentTextVersion: 'v1',
    submittedAt: new Date('2026-01-01T12:00:00.000Z'),
    readAt: null,
    repliedAt: null,
    archivedAt: null,
    adminNotes: null,
    metadata: { ip: '127.0.0.1' },
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
    updatedAt: new Date('2026-01-01T12:00:00.000Z'),
    ...overrides,
  };
}

describe('Admin messages (e2e)', () => {
  let app: INestApplication<App>;
  let row = messageRow();
  const listInbox = vi.fn();
  const findByIdAdmin = vi.fn();
  const updateMessage = vi.fn();
  const deleteMessage = vi.fn();

  beforeEach(async () => {
    row = messageRow();
    listInbox.mockReset();
    findByIdAdmin.mockReset();
    updateMessage.mockReset();
    deleteMessage.mockReset();

    listInbox.mockImplementation(async (query = {}) => {
      const items =
        query.status === 'spam'
          ? [messageRow({ status: 'spam' })]
          : query.status === 'new'
            ? [row]
            : [row];
      return buildPaginatedResponse(items, {
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        total: items.length,
      });
    });
    findByIdAdmin.mockImplementation(async (id: string) => {
      if (id !== MESSAGE_ID) throw new NotFoundException('Message not found');
      return { ...row, isRead: true, status: 'read' };
    });
    updateMessage.mockImplementation(async (id: string, patch: object) => {
      if (id !== MESSAGE_ID) throw new NotFoundException('Message not found');
      row = { ...row, ...patch, status: (patch as { status?: string }).status ?? row.status };
      if (patch && 'status' in patch && patch.status === 'replied') {
        row.repliedAt = new Date('2026-01-02T12:00:00.000Z');
      }
      return row;
    });
    deleteMessage.mockImplementation(async (id: string) => {
      if (id !== MESSAGE_ID) throw new NotFoundException('Message not found');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminMessagesController],
      providers: [
        AdminMessagesService,
        {
          provide: ContactService,
          useValue: { listInbox, findByIdAdmin, updateMessage, deleteMessage },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists messages with snippet only, then detail, patch, delete', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/admin/messages')
      .expect(200);

    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.items).toHaveLength(1);
    expect(listRes.body.data.items[0].bodySnippet).toBeTruthy();
    expect(listRes.body.data.items[0].body).toBeUndefined();
    expect(listRes.body.data.items[0].senderEmail).toBe('ada@example.com');

    const getRes = await request(app.getHttpServer())
      .get(`/api/v1/admin/messages/${MESSAGE_ID}`)
      .expect(200);

    expect(findByIdAdmin).toHaveBeenCalledWith(MESSAGE_ID);
    expect(getRes.body.data.body).toContain('Hello world!');
    expect(getRes.body.data.metadata).toEqual({ ip: '127.0.0.1' });

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/admin/messages/${MESSAGE_ID}`)
      .send({ status: 'replied' })
      .expect(200);

    expect(patchRes.body.data.status).toBe('replied');
    expect(patchRes.body.data.repliedAt).toBeTruthy();

    await request(app.getHttpServer())
      .delete(`/api/v1/admin/messages/${MESSAGE_ID}`)
      .expect(200);

    findByIdAdmin.mockRejectedValueOnce(
      new NotFoundException('Message not found'),
    );
    await request(app.getHttpServer())
      .get(`/api/v1/admin/messages/${MESSAGE_ID}`)
      .expect(404);
  });

  it('passes list filters and spam exclude rule to ContactService', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/messages')
      .query({ status: 'new' })
      .expect(200);

    expect(listInbox).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'new', excludeSpam: true }),
    );

    await request(app.getHttpServer())
      .get('/api/v1/admin/messages')
      .query({ status: 'spam' })
      .expect(200);

    expect(listInbox).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'spam', excludeSpam: false }),
    );
  });

  it('rejects empty PATCH body', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/messages/${MESSAGE_ID}`)
      .send({})
      .expect(400);
  });
});

describe('Admin messages auth (e2e)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 when admin guard rejects', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminMessagesController],
      providers: [
        AdminMessagesService,
        {
          provide: ContactService,
          useValue: {
            listInbox: vi.fn(),
            findByIdAdmin: vi.fn(),
            updateMessage: vi.fn(),
            deleteMessage: vi.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: vi.fn(() => {
          throw new UnauthorizedException();
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/admin/messages')
      .expect(401);
  });
});
