import { describe, expect, it, vi } from 'vitest';
import { CollaborationsService } from './collaborations.service';

const mediaMock = {
  assertImageMediaId: vi.fn().mockResolvedValue({}),
};

function collaborationsService(db: unknown): CollaborationsService {
  return new CollaborationsService(db as never, mediaMock as never);
}

describe('CollaborationsService.listPublishedPublic', () => {
  it('excludes draft rows', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              {
                id: 'c1',
                partnerName: 'Lab',
                summary: 'Work',
                institution: null,
                logoMediaId: null,
                role: null,
                period: null,
                outcomes: null,
                sortOrder: 0,
                publishStatus: 'draft',
                publishedAt: null,
                scheduledAt: null,
                archivedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'c2',
                partnerName: 'Lab2',
                summary: 'Pub',
                institution: null,
                logoMediaId: null,
                role: null,
                period: null,
                outcomes: null,
                sortOrder: 0,
                publishStatus: 'published',
                publishedAt: new Date(),
                scheduledAt: null,
                archivedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ]),
          }),
        }),
      }),
    };
    const cards = await collaborationsService(db).listPublishedPublic();
    expect(cards).toHaveLength(1);
    expect(cards[0]!.partnerName).toBe('Lab2');
  });
});
