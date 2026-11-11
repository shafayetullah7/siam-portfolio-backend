import { NotFoundException } from '@nestjs/common';
import type { MediaService } from '../media/media.service';

export type ResolvedHeroPortrait = {
  url: string;
  alt: string;
};

async function resolveOne(
  media: MediaService,
  mediaId: string,
): Promise<ResolvedHeroPortrait | null> {
  try {
    const row = await media.findById(mediaId);
    const url = row.url?.trim() ?? '';
    const alt = row.alt?.trim() ?? '';
    if (!url || !alt) return null;
    return { url, alt };
  } catch (error) {
    if (error instanceof NotFoundException) {
      return null;
    }
    throw error;
  }
}

/** Homepage heroMediaId overrides profile portraitMediaId (HOME10). */
export async function resolveHeroPortraitForPublic(
  media: MediaService,
  heroMediaId: string | null,
  portraitMediaId: string | null,
): Promise<ResolvedHeroPortrait | null> {
  if (heroMediaId) {
    return resolveOne(media, heroMediaId);
  }
  if (portraitMediaId) {
    return resolveOne(media, portraitMediaId);
  }
  return null;
}
