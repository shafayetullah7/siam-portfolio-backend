import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import { SitePagesService } from './site-pages.service';

describe('isPubliclyVisible', () => {
  it('hides draft and archived', () => {
    expect(isPubliclyVisible('draft', null)).toBe(false);
    expect(isPubliclyVisible('archived', null)).toBe(false);
  });

  it('shows published', () => {
    expect(isPubliclyVisible('published', null)).toBe(true);
  });

  it('shows scheduled when due', () => {
    const past = new Date(Date.now() - 1000);
    expect(isPubliclyVisible('scheduled', past)).toBe(true);
  });
});

describe('SitePagesService.findPublishedBySlug', () => {
  it('returns 404 for draft slug', async () => {
    const revisions = { append: vi.fn() };
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: '1',
                slug: 'draft-page',
                publishStatus: 'draft',
                scheduledAt: null,
                title: 'T',
                body: '',
              },
            ]),
          }),
        }),
      }),
    };
    const service = new SitePagesService(db as never, revisions as never);
    await expect(service.findPublishedBySlug('draft-page')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
