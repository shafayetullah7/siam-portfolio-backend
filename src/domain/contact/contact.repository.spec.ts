import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ContactRepository } from './contact.repository';

const messageRow = {
  id: 'msg-1',
  status: 'new' as const,
  isRead: false,
  category: 'Collaboration',
  senderName: 'Ada',
  senderEmail: 'ada@example.com',
  affiliation: null,
  subject: null,
  body: 'Hello there',
  consentGiven: true,
  consentTextVersion: 'v1',
  submittedAt: new Date('2026-01-01T12:00:00Z'),
  readAt: null,
  repliedAt: null,
  archivedAt: null,
  adminNotes: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ContactRepository', () => {
  it('insert returns the created row', async () => {
    const returning = vi.fn().mockResolvedValue([messageRow]);
    const values = vi.fn().mockReturnValue({ returning });
    const db = {
      insert: vi.fn().mockReturnValue({ values }),
    };
    const repo = new ContactRepository(db as never);

    const result = await repo.insert({
      senderName: 'Ada',
      senderEmail: 'ada@example.com',
      body: 'Hello there',
    });

    expect(result).toEqual(messageRow);
    expect(values).toHaveBeenCalled();
  });

  it('findById returns null when missing', async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    };
    const repo = new ContactRepository(db as never);
    await expect(repo.findById('missing')).resolves.toBeNull();
  });

  it('list returns paginated rows and calls where when excludeSpam', async () => {
    const where = vi.fn().mockResolvedValue([{ value: 1 }]);
    const countFrom = vi.fn(() => ({ where }));
    const countSelect = vi.fn(() => ({ from: countFrom }));

    const listWhere = vi.fn().mockResolvedValue([messageRow]);
    const listOffset = vi.fn(() => ({ where: listWhere }));
    const listLimit = vi.fn(() => ({ offset: listOffset }));
    const listOrderBy = vi.fn(() => ({ limit: listLimit }));
    const listFrom = vi.fn(() => ({ orderBy: listOrderBy }));
    const listSelect = vi.fn(() => ({ from: listFrom }));

    let selectCall = 0;
    const db = {
      select: vi.fn(() => {
        selectCall += 1;
        return selectCall === 1 ? countSelect() : listSelect();
      }),
    };

    const repo = new ContactRepository(db as never);
    const result = await repo.list({ excludeSpam: true, page: 1, limit: 20 });

    expect(result.items).toEqual([messageRow]);
    expect(result.meta.total).toBe(1);
    expect(where).toHaveBeenCalled();
    expect(listWhere).toHaveBeenCalled();
  });

  it('update throws NotFoundException when row missing', async () => {
    const db = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    };
    const repo = new ContactRepository(db as never);
    await expect(
      repo.update('missing', { isRead: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delete throws NotFoundException when row missing', async () => {
    const db = {
      delete: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([]),
        })),
      })),
    };
    const repo = new ContactRepository(db as never);
    await expect(repo.delete('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
