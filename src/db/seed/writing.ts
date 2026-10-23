/**
 * Local/dev only — seeds articles from writing.catalog.ts.
 * Requires WRIT11 junction migrations (`writing_article_*` tables).
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { recomputeReadingStats } from '../../domain/writing/writing-reading-stats';
import { media } from '../schema/media';
import { projects } from '../schema/projects';
import { publications } from '../schema/publications';
import { researchThemes } from '../schema/research';
import { articles } from '../schema/writing/articles';
import {
  writingArticleProjects,
  writingArticlePublications,
  writingArticleRelated,
  writingArticleResearchThemes,
} from '../schema/writing/writing-article-junctions';
import { writingSeries } from '../schema/writing/writing-series';
import {
  writingArticlesCatalog,
  writingSeriesCatalog,
  type WritingArticleSeedEntry,
} from './writing.catalog';

const SEED_COVER_FILE = 'writing-seed-cover.jpg';
const SEED_COVER_URL =
  'https://res.cloudinary.com/demo/image/upload/sample.jpg';

async function ensureSeedCoverMedia(db: NodePgDatabase): Promise<string> {
  const [existing] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.fileName, SEED_COVER_FILE))
    .limit(1);
  if (existing) {
    return existing.id;
  }
  const [row] = await db
    .insert(media)
    .values({
      fileName: SEED_COVER_FILE,
      mimeType: 'image/jpeg',
      size: 0,
      url: SEED_COVER_URL,
      alt: 'Abstract gradient placeholder cover for dev writing seed',
    })
    .returning({ id: media.id });
  return row.id;
}

async function ensureSeries(
  db: NodePgDatabase,
): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();
  for (const entry of writingSeriesCatalog) {
    const [existing] = await db
      .select({ id: writingSeries.id })
      .from(writingSeries)
      .where(eq(writingSeries.slug, entry.slug))
      .limit(1);
    if (existing) {
      bySlug.set(entry.slug, existing.id);
      continue;
    }
    const [row] = await db
      .insert(writingSeries)
      .values({
        slug: entry.slug,
        title: entry.title,
        summary: entry.summary ?? null,
        sortOrder: entry.sortOrder ?? 0,
      })
      .returning({ id: writingSeries.id });
    bySlug.set(entry.slug, row.id);
  }
  return bySlug;
}

async function findArticleIdBySlug(
  db: NodePgDatabase,
  slug: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

async function linkShowcaseRelations(
  db: NodePgDatabase,
  articleId: string,
  entry: WritingArticleSeedEntry,
): Promise<void> {
  if (entry.linkPublicationSlug) {
    const [pub] = await db
      .select({ id: publications.id })
      .from(publications)
      .where(eq(publications.slug, entry.linkPublicationSlug))
      .limit(1);
    if (pub) {
      await db.insert(writingArticlePublications).values({
        articleId,
        publicationId: pub.id,
        sortOrder: 0,
      });
    }
  }
  if (entry.linkProjectSlug) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.slug, entry.linkProjectSlug))
      .limit(1);
    if (project) {
      await db.insert(writingArticleProjects).values({
        articleId,
        projectId: project.id,
        sortOrder: 0,
      });
    }
  }
  if (entry.linkThemeSlug) {
    const [theme] = await db
      .select({ id: researchThemes.id })
      .from(researchThemes)
      .where(eq(researchThemes.slug, entry.linkThemeSlug))
      .limit(1);
    if (theme) {
      await db.insert(writingArticleResearchThemes).values({
        articleId,
        themeId: theme.id,
        sortOrder: 0,
      });
    }
  }
  if (entry.relatedArticleSlug) {
    const relatedId = await findArticleIdBySlug(db, entry.relatedArticleSlug);
    if (relatedId && relatedId !== articleId) {
      await db.insert(writingArticleRelated).values({
        articleId,
        relatedArticleId: relatedId,
        sortOrder: 0,
      });
    }
  }
}

export async function seedWriting(db: NodePgDatabase): Promise<void> {
  const seriesBySlug = await ensureSeries(db);
  let inserted = 0;
  let skipped = 0;
  const coverMediaId = await ensureSeedCoverMedia(db);
  const showcaseEntry = writingArticlesCatalog.find((e) => e.useSeedCover);

  for (const entry of writingArticlesCatalog) {
    const [existing] = await db
      .select({ slug: articles.slug })
      .from(articles)
      .where(eq(articles.slug, entry.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const publishStatus = entry.publishStatus ?? 'draft';
    const publishedAt =
      publishStatus === 'published' ? new Date() : null;
    const scheduledAt =
      publishStatus === 'scheduled' && entry.scheduledAtIso
        ? new Date(entry.scheduledAtIso)
        : null;
    const stats = recomputeReadingStats(entry.body);
    const seriesId =
      entry.seriesSlug != null
        ? seriesBySlug.get(entry.seriesSlug) ?? null
        : null;

    const [row] = await db
      .insert(articles)
      .values({
        slug: entry.slug,
        title: entry.title,
        subtitle: entry.subtitle ?? null,
        summary: entry.summary,
        body: entry.body,
        tags: entry.tags ? [...entry.tags] : null,
        seriesId,
        seriesSortOrder: entry.seriesSortOrder ?? null,
        coverMediaId: entry.useSeedCover ? coverMediaId : null,
        readingTimeMinutes: stats.readingTimeMinutes,
        wordCount: stats.wordCount,
        featuredOnHub: entry.featuredOnHub ?? false,
        publishStatus,
        publishedAt,
        scheduledAt,
      })
      .returning({ id: articles.id });

    inserted += 1;
  }

  if (showcaseEntry) {
    const showcaseId = await findArticleIdBySlug(db, showcaseEntry.slug);
    if (showcaseId) {
      const [existingPubLink] = await db
        .select({ id: writingArticlePublications.id })
        .from(writingArticlePublications)
        .where(eq(writingArticlePublications.articleId, showcaseId))
        .limit(1);
      if (!existingPubLink) {
        await linkShowcaseRelations(db, showcaseId, showcaseEntry);
      }
    }
  }

  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} article(s) (${skipped} already existed). Drafts stay admin-only until publish.`,
    );
  } else if (skipped > 0) {
    console.log(`Writing seed skipped — ${skipped} slug(s) already exist.`);
  }
}
