import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { resolveHeroPortraitForPublic } from './profile-home-hero-media';

function mockMedia(findImpl: (id: string) => Promise<{ url: string; alt: string | null }>) {
  return { findById: vi.fn(findImpl) };
}

describe('resolveHeroPortraitForPublic', () => {
  it('prefers heroMediaId over portraitMediaId', async () => {
    const media = mockMedia(async (id) => {
      if (id === 'hero') return { url: 'https://cdn/hero.jpg', alt: 'Hero alt' };
      return { url: 'https://cdn/portrait.jpg', alt: 'Portrait alt' };
    });
    const result = await resolveHeroPortraitForPublic(
      media as never,
      'hero',
      'portrait',
    );
    expect(result).toEqual({ url: 'https://cdn/hero.jpg', alt: 'Hero alt' });
    expect(media.findById).toHaveBeenCalledWith('hero');
    expect(media.findById).toHaveBeenCalledTimes(1);
  });

  it('falls back to portrait when hero media id is null', async () => {
    const media = mockMedia(async () => ({
      url: 'https://cdn/p.jpg',
      alt: 'P',
    }));
    const result = await resolveHeroPortraitForPublic(media as never, null, 'portrait');
    expect(result).toEqual({ url: 'https://cdn/p.jpg', alt: 'P' });
  });

  it('returns null when alt is empty', async () => {
    const media = mockMedia(async () => ({
      url: 'https://cdn/p.jpg',
      alt: '',
    }));
    const result = await resolveHeroPortraitForPublic(media as never, 'x', null);
    expect(result).toBeNull();
  });

  it('returns null when media row is missing', async () => {
    const media = mockMedia(async () => {
      throw new NotFoundException();
    });
    const result = await resolveHeroPortraitForPublic(media as never, 'missing', null);
    expect(result).toBeNull();
  });
});
