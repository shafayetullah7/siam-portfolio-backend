/**
 * Local/dev only — seeds publications from publications.catalog.ts.
 * Published rows appear on the public site; drafts stay admin-only until publish.
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { publicationAuthors } from '../schema/publication-authors';
import { publications } from '../schema/publications';
import { researchThemePublications, researchThemes } from '../schema/research';
import { formatAuthorsShort } from '../../domain/publications/publication-authors';
import {
  publicationsCatalog,
  type PublicationSeedEntry,
} from './publications.catalog';

async function linkPublicationToTheme(
  db: NodePgDatabase,
  themeSlug: string,
  publicationId: string,
): Promise<void> {
  const [theme] = await db
    .select({ id: researchThemes.id })
    .from(researchThemes)
    .where(eq(researchThemes.slug, themeSlug))
    .limit(1);
  if (!theme) return;

  const [existing] = await db
    .select({ id: researchThemePublications.id })
    .from(researchThemePublications)
    .where(eq(researchThemePublications.publicationId, publicationId))
    .limit(1);
  if (existing) return;

  await db.insert(researchThemePublications).values({
    themeId: theme.id,
    publicationId,
    sortOrder: 0,
  });
}

function authorsShortForEntry(entry: PublicationSeedEntry): string {
  return formatAuthorsShort(entry.authors.map((a) => ({ name: a.name })));
}

export async function seedPublications(db: NodePgDatabase): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const entry of publicationsCatalog) {
    const [existing] = await db
      .select({ slug: publications.slug })
      .from(publications)
      .where(eq(publications.slug, entry.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const publishStatus = entry.publishStatus ?? 'draft';
    const publishedAt =
      publishStatus === 'published' ? new Date() : null;

    const [row] = await db
      .insert(publications)
      .values({
        slug: entry.slug,
        title: entry.title,
        authorsShort: authorsShortForEntry(entry),
        year: entry.year,
        venue: entry.venue,
        significance: entry.significance ?? null,
        abstract: entry.abstract ?? null,
        publicationType: entry.publicationType ?? 'other',
        peerReviewed: entry.peerReviewed ?? false,
        doi: entry.doi ?? null,
        featured: entry.featured ?? false,
        featuredOnHome: entry.featuredOnHome ?? false,
        publishStatus,
        publishedAt,
      })
      .returning({ id: publications.id });

    for (let index = 0; index < entry.authors.length; index += 1) {
      const author = entry.authors[index];
      await db.insert(publicationAuthors).values({
        publicationId: row.id,
        sortOrder: index,
        name: author.name,
        affiliation: author.affiliation ?? null,
      });
    }

    if (entry.linkThemeSlug && publishStatus === 'published') {
      await linkPublicationToTheme(db, entry.linkThemeSlug, row.id);
    }

    inserted += 1;
  }

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} publication(s) (${skipped} already existed). Drafts need publish via /admin/publications.`,
    );
  } else if (skipped > 0) {
    console.log(`Publications seed skipped — ${skipped} slug(s) already exist.`);
  }
}
