import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ProjectsService } from './projects.service';

describe('ProjectsService.findByIdAdmin', () => {
  it('throws when missing', async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    const service = new ProjectsService(db as never);
    await expect(service.findByIdAdmin('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('ProjectsService.findManyByIds', () => {
  it('preserves caller order', async () => {
    const rowA = {
      id: 'a',
      slug: 'a',
      title: 'A',
      summary: 'S',
      tags: null,
      publishStatus: 'published',
      publishedAt: null,
      scheduledAt: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const rowB = { ...rowA, id: 'b', slug: 'b', title: 'B' };
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([rowB, rowA]),
        }),
      }),
    };
    const service = new ProjectsService(db as never);
    const rows = await service.findManyByIds(['a', 'b']);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});
