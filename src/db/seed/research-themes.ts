/**
 * Local/dev only — seeds draft research themes from the frontend catalog.
 * Publish from /admin/research when you want them on the public site.
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { researchThemes } from '../schema/research';
import { researchThemesCatalog } from './research-themes.catalog';

export async function seedResearchThemes(db: NodePgDatabase): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (let index = 0; index < researchThemesCatalog.length; index += 1) {
    const entry = researchThemesCatalog[index];
    const [existing] = await db
      .select({ slug: researchThemes.slug })
      .from(researchThemes)
      .where(eq(researchThemes.slug, entry.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const tags = entry.tags ? [...entry.tags] : null;
    await db.insert(researchThemes).values({
      slug: entry.slug,
      title: entry.title,
      summary: entry.description,
      themeStatus: entry.status ?? 'ongoing',
      problem: entry.problem ?? 'Replace with approved problem statement.',
      approach: entry.approach ?? null,
      tags,
      linkLabel: entry.linkLabel ?? null,
      sortOrder: index,
      featuredOnHome: entry.featuredOnHome ?? false,
      publishStatus: 'draft',
    });
    inserted += 1;
  }

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} research theme(s) as draft (${skipped} already existed). Publish via /admin/research.`,
    );
  } else if (skipped > 0) {
    console.log(`Research themes seed skipped — ${skipped} slug(s) already exist.`);
  }
}
