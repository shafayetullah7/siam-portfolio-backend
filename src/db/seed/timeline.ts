/**
 * Local/dev only — seeds timeline entries from timeline.catalog.ts.
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { media } from '../schema/media';
import { projects } from '../schema/projects';
import { publications } from '../schema/publications';
import { timelineEntries } from '../schema/timeline/timeline-entries';
import { timelineEntryMedia } from '../schema/timeline/timeline-entry-media';
import {
  timelineCatalog,
  type TimelineGalleryImageSeed,
  type TimelineSeedEntry,
} from './timeline.catalog';

async function ensureGalleryMedia(
  db: NodePgDatabase,
  image: TimelineGalleryImageSeed,
): Promise<string> {
  const [existing] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.fileName, image.fileName))
    .limit(1);
  if (existing) {
    return existing.id;
  }
  const [row] = await db
    .insert(media)
    .values({
      fileName: image.fileName,
      mimeType: 'image/jpeg',
      size: 0,
      url: image.url,
      alt: image.alt,
    })
    .returning({ id: media.id });
  return row.id;
}

async function linkOptionalRelations(
  db: NodePgDatabase,
  entryId: string,
  entry: TimelineSeedEntry,
): Promise<void> {
  let publicationId: string | null = null;
  let projectId: string | null = null;

  if (entry.linkPublicationSlug) {
    const [pub] = await db
      .select({ id: publications.id })
      .from(publications)
      .where(eq(publications.slug, entry.linkPublicationSlug))
      .limit(1);
    publicationId = pub?.id ?? null;
  }
  if (entry.linkProjectSlug) {
    const [proj] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, entry.linkProjectSlug))
      .limit(1);
    projectId = proj?.id ?? null;
  }
  if (publicationId || projectId) {
    await db
      .update(timelineEntries)
      .set({
        ...(publicationId ? { publicationId } : {}),
        ...(projectId ? { projectId } : {}),
      })
      .where(eq(timelineEntries.id, entryId));
  }
}

export async function seedTimeline(db: NodePgDatabase): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (let index = 0; index < timelineCatalog.length; index += 1) {
    const entry = timelineCatalog[index];
    const [existing] = await db
      .select({ slug: timelineEntries.slug })
      .from(timelineEntries)
      .where(eq(timelineEntries.slug, entry.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const publishStatus = entry.publishStatus ?? 'draft';
    const publishedAt = publishStatus === 'published' ? new Date() : null;

    const [row] = await db
      .insert(timelineEntries)
      .values({
        kind: entry.kind,
        slug: entry.slug,
        title: entry.title,
        subtitle: entry.subtitle ?? null,
        summary: entry.summary ?? null,
        organization: entry.organization ?? null,
        location: entry.location ?? null,
        startDate: entry.startDate ?? null,
        endDate: entry.endDate ?? null,
        isOngoing: entry.isOngoing ?? false,
        isCurrent: entry.isCurrent ?? null,
        proofUrl: entry.proofUrl ?? null,
        rankOrPlacement: entry.rankOrPlacement ?? null,
        credentialId: entry.credentialId ?? null,
        expiresAt: entry.expiresAt ?? null,
        featured: entry.featured ?? false,
        sortOrder: entry.sortOrder ?? index,
        publishStatus,
        publishedAt,
      })
      .returning({ id: timelineEntries.id });

    const gallery = entry.galleryImages ?? [];
    for (const image of gallery) {
      const mediaId = await ensureGalleryMedia(db, image);
      await db.insert(timelineEntryMedia).values({
        timelineEntryId: row.id,
        mediaId,
        sortOrder: image.sortOrder,
        caption: image.caption ?? null,
        imageRole: image.imageRole ?? null,
      });
    }

    await linkOptionalRelations(db, row.id, entry);
    inserted += 1;
  }

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} timeline entr${inserted === 1 ? 'y' : 'ies'} (${skipped} already existed). Visit /achievements and /about after publish.`,
    );
  } else if (skipped > 0) {
    console.log(`Timeline seed skipped — ${skipped} slug(s) already exist.`);
  }
}
