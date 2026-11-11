/**
 * Local/dev only — seeds talks, collaborations, academic service (M11).
 */
import { and, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { researchThemes } from '../schema/research';
import { siteSettings } from '../schema/site';
import { academicServiceEntries } from '../schema/talks/academic-service-entries';
import { collaborations } from '../schema/talks/collaborations';
import { talkResearchThemes } from '../schema/talks/talk-junctions';
import { talkResources } from '../schema/talks/talk-resources';
import { talks } from '../schema/talks/talks';
import {
  academicServiceCatalog,
  collaborationsCatalog,
  talksCatalog,
  talksSiteDefaults,
  type TalkSeedEntry,
} from './talks.catalog';

function isEmptyText(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

async function ensureSiteSettingsRow(db: NodePgDatabase) {
  const [existing] = await db.select().from(siteSettings).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(siteSettings)
    .values({ siteName: 'SIAM' })
    .returning();
  return created;
}

async function seedTalksSiteDefaults(db: NodePgDatabase): Promise<boolean> {
  const row = await ensureSiteSettingsRow(db);
  const patch: Partial<typeof siteSettings.$inferInsert> = {};

  if (isEmptyText(row.talksHubIntro)) {
    patch.talksHubIntro = talksSiteDefaults.talksHubIntro;
  }
  if (isEmptyText(row.collaborationsPageIntro)) {
    patch.collaborationsPageIntro = talksSiteDefaults.collaborationsPageIntro;
  }
  if (!row.collaborationsPageEnabled) {
    patch.collaborationsPageEnabled =
      talksSiteDefaults.collaborationsPageEnabled;
  }

  if (Object.keys(patch).length === 0) {
    return false;
  }

  await db
    .update(siteSettings)
    .set(patch)
    .where(eq(siteSettings.id, row.id));
  return true;
}

async function findTalkIdBySlug(
  db: NodePgDatabase,
  slug: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: talks.id })
    .from(talks)
    .where(eq(talks.slug, slug))
    .limit(1);
  return row?.id ?? null;
}

async function linkTalkToTheme(
  db: NodePgDatabase,
  talkId: string,
  themeSlug: string,
): Promise<void> {
  const [theme] = await db
    .select({ id: researchThemes.id })
    .from(researchThemes)
    .where(eq(researchThemes.slug, themeSlug))
    .limit(1);
  if (!theme) return;

  const [existing] = await db
    .select({ id: talkResearchThemes.id })
    .from(talkResearchThemes)
    .where(
      and(
        eq(talkResearchThemes.talkId, talkId),
        eq(talkResearchThemes.themeId, theme.id),
      ),
    )
    .limit(1);
  if (existing) return;

  await db.insert(talkResearchThemes).values({
    talkId,
    themeId: theme.id,
    sortOrder: 0,
  });
}

async function insertTalkIfMissing(
  db: NodePgDatabase,
  entry: TalkSeedEntry,
): Promise<'inserted' | 'skipped'> {
  const existingId = await findTalkIdBySlug(db, entry.slug);
  if (existingId) {
    if (entry.linkThemeSlug) {
      await linkTalkToTheme(db, existingId, entry.linkThemeSlug);
    }
    return 'skipped';
  }

  const publishedAt =
    entry.publishStatus === 'published' ? new Date() : null;

  const [row] = await db
    .insert(talks)
    .values({
      slug: entry.slug,
      title: entry.title,
      eventName: entry.eventName,
      timezone: entry.timezone,
      startsAt: new Date(entry.startsAt),
      talkType: entry.talkType ?? 'other',
      description: entry.description ?? null,
      publishStatus: entry.publishStatus,
      publishedAt,
      isOnline: entry.isOnline ?? false,
      location: entry.location ?? null,
      venue: entry.venue ?? null,
      role: 'speaker',
    })
    .returning({ id: talks.id });

  const resources = entry.resources ?? [];
  for (let i = 0; i < resources.length; i += 1) {
    const res = resources[i]!;
    await db.insert(talkResources).values({
      talkId: row.id,
      label: res.label,
      url: res.url,
      resourceType: res.resourceType,
      sortOrder: res.sortOrder ?? i,
    });
  }

  if (entry.linkThemeSlug) {
    await linkTalkToTheme(db, row.id, entry.linkThemeSlug);
  }

  return 'inserted';
}

async function collaborationExists(
  db: NodePgDatabase,
  partnerNameMarker: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: collaborations.id })
    .from(collaborations)
    .where(eq(collaborations.partnerName, partnerNameMarker))
    .limit(1);
  return Boolean(row);
}

async function seedCollaborations(db: NodePgDatabase): Promise<number> {
  let inserted = 0;
  for (const entry of collaborationsCatalog) {
    const partnerName = `[seed:${entry.slugKey}] ${entry.partnerName}`;
    if (await collaborationExists(db, partnerName)) {
      continue;
    }
    await db.insert(collaborations).values({
      partnerName,
      institution: entry.institution ?? null,
      role: entry.role ?? null,
      period: entry.period ?? null,
      summary: entry.summary,
      publishStatus: entry.publishStatus,
      publishedAt:
        entry.publishStatus === 'published' ? new Date() : null,
      sortOrder: inserted,
    });
    inserted += 1;
  }
  return inserted;
}

async function academicServiceExists(
  db: NodePgDatabase,
  slugKey: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: academicServiceEntries.id })
    .from(academicServiceEntries)
    .where(eq(academicServiceEntries.organization, `[seed:${slugKey}]`))
    .limit(1);
  return Boolean(row);
}

async function seedAcademicService(db: NodePgDatabase): Promise<number> {
  let inserted = 0;
  for (const entry of academicServiceCatalog) {
    if (await academicServiceExists(db, entry.slugKey)) {
      continue;
    }
    await db.insert(academicServiceEntries).values({
      serviceType: entry.serviceType,
      organization: `[seed:${entry.slugKey}] ${entry.organization}`,
      roleTitle: entry.roleTitle,
      startYear: entry.startYear ?? null,
      endYear: entry.endYear ?? null,
      summary: entry.summary ?? null,
      proofUrl: entry.proofUrl ?? null,
      publishStatus: entry.publishStatus,
      publishedAt: new Date(),
      sortOrder: inserted,
    });
    inserted += 1;
  }
  return inserted;
}

export async function seedTalks(db: NodePgDatabase): Promise<void> {
  let talksInserted = 0;
  let talksSkipped = 0;

  for (const entry of talksCatalog) {
    const result = await insertTalkIfMissing(db, entry);
    if (result === 'inserted') talksInserted += 1;
    else talksSkipped += 1;
  }

  const collabInserted = await seedCollaborations(db);
  const serviceInserted = await seedAcademicService(db);
  const sitePatched = await seedTalksSiteDefaults(db);

  if (talksInserted > 0 || collabInserted > 0 || serviceInserted > 0) {
    console.log(
      `Seeded talks module: ${talksInserted} talk(s), ${collabInserted} collaboration(s), ${serviceInserted} service row(s)${sitePatched ? '; site M11 defaults applied' : ''}. Visit /talks and /admin/talks.`,
    );
  } else if (talksSkipped > 0) {
    console.log(
      `Talks seed skipped — catalog slug(s) already exist (${talksSkipped} talk(s)).`,
    );
  }
}
