import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ContactService } from './contact.service';
import type { ContactMessageRow } from './contact.types';

const settingsEnabled = {
  contactFormEnabled: true,
  contactCategories: [] as string[],
  contactConsentText: null,
};

const messageRow = {
  id: 'msg-1',
  status: 'new' as const,
  isRead: false,
  category: null,
  senderName: 'Ada',
  senderEmail: 'ada@example.com',
  affiliation: null,
  subject: null,
  body: 'Hello world!',
  consentGiven: false,
  consentTextVersion: null,
  submittedAt: new Date(),
  readAt: null,
  repliedAt: null,
  archivedAt: null,
  adminNotes: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies ContactMessageRow;

function createService(overrides?: {
  settings?: typeof settingsEnabled;
  insert?: ReturnType<typeof vi.fn>;
}) {
  const repository = {
    insert: overrides?.insert ?? vi.fn().mockResolvedValue(messageRow),
    list: vi.fn().mockResolvedValue({ items: [], meta: { total: 0 } }),
    findByIdOrThrow: vi.fn().mockResolvedValue(messageRow),
    update: vi.fn().mockResolvedValue({ ...messageRow, isRead: true }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const siteService = {
    getOrCreateSettings: vi.fn().mockResolvedValue(
      overrides?.settings ?? settingsEnabled,
    ),
  };
  const turnstile = {
    isEnabled: false,
    verify: vi.fn().mockResolvedValue(undefined),
  };
  const service = new ContactService(
    repository as never,
    siteService as never,
    turnstile as never,
  );
  return { service, repository, siteService, turnstile };
}

describe('ContactService.submitInquiry', () => {
  it('throws when contact form is disabled', async () => {
    const { service } = createService({
      settings: { ...settingsEnabled, contactFormEnabled: false },
    });
    await expect(
      service.submitInquiry({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello world!',
        consent: false,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects honeypot', async () => {
    const { service } = createService();
    await expect(
      service.submitInquiry({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello world!',
        consent: false,
        website: 'http://spam.test',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('inserts a new message when valid', async () => {
    const insert = vi.fn().mockResolvedValue(messageRow);
    const { service, repository } = createService({ insert });
    const row = await service.submitInquiry({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello world!',
      consent: false,
    });
    expect(row.id).toBe('msg-1');
    expect(repository.insert).toHaveBeenCalled();
  });
});

describe('ContactService.listInbox', () => {
  it('defaults excludeSpam to true', async () => {
    const { service, repository } = createService();
    await service.listInbox();
    expect(repository.list).toHaveBeenCalledWith(
      expect.objectContaining({ excludeSpam: true }),
    );
  });
});

describe('ContactService.findByIdAdmin', () => {
  it('marks unread non-spam messages read on open', async () => {
    const { service, repository } = createService();
    await service.findByIdAdmin('msg-1');
    expect(repository.update).toHaveBeenCalledWith(
      'msg-1',
      expect.objectContaining({ isRead: true, status: 'read' }),
    );
  });
});

describe('ContactService.bulkUpdateMessages', () => {
  it('updates each id with status patch', async () => {
    const { service, repository } = createService();
    const result = await service.bulkUpdateMessages(
      ['msg-1', 'msg-2'],
      { isRead: true },
    );
    expect(result.updated).toBe(2);
    expect(repository.findByIdOrThrow).toHaveBeenCalledTimes(2);
    expect(repository.update).toHaveBeenCalledTimes(2);
  });
});
