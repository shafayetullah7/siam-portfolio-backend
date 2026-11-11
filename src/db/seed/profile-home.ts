/**
 * Local/dev only — seeds singleton profile and homepage (M5 / HOME12).
 */
import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { homepage, profile } from '../schema/profile-home';
import type { HomeSectionConfigRow } from '../schema/profile-home-json.types';
import {
  defaultHomeSections,
  homepageCompositionDefaults,
  profileIdentityDefaults,
} from './profile-home.catalog';

function isEmptyText(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function isEmptyJsonArray(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function isEmptySections(value: HomeSectionConfigRow[] | null | undefined): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function isEmptyRecord(value: Record<string, unknown> | null | undefined): boolean {
  if (value == null) return true;
  return Object.keys(value).length === 0;
}

async function ensureProfileRow(db: NodePgDatabase) {
  const [existing] = await db.select().from(profile).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(profile).values({}).returning();
  return created;
}

async function ensureHomepageRow(db: NodePgDatabase) {
  const [existing] = await db.select().from(homepage).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(homepage).values({}).returning();
  return created;
}

function isProfilePristine(
  row: typeof profile.$inferSelect,
): boolean {
  return (
    row.publishStatus === 'draft' &&
    isEmptyText(row.displayName) &&
    isEmptyText(row.headline)
  );
}

function isHomepagePristine(
  row: typeof homepage.$inferSelect,
): boolean {
  return (
    row.publishStatus === 'draft' &&
    isEmptyText(row.heroTitle) &&
    isEmptyText(row.heroDescriptor)
  );
}

function buildProfilePatch(
  row: typeof profile.$inferSelect,
): Partial<typeof profile.$inferInsert> {
  const d = profileIdentityDefaults;
  const patch: Partial<typeof profile.$inferInsert> = {};

  if (isEmptyText(row.displayName)) patch.displayName = d.displayName;
  if (isEmptyText(row.professionalTitle)) patch.professionalTitle = d.professionalTitle;
  if (isEmptyText(row.headline)) patch.headline = d.headline;
  if (isEmptyText(row.shortBio)) patch.shortBio = d.shortBio;
  if (isEmptyText(row.longBio)) patch.longBio = d.longBio;
  if (isEmptyText(row.researchStatement)) patch.researchStatement = d.researchStatement;
  if (isEmptyText(row.affiliation)) patch.affiliation = d.affiliation;
  if (isEmptyText(row.affiliationRole)) patch.affiliationRole = d.affiliationRole;
  if (isEmptyText(row.affiliationOrganization)) {
    patch.affiliationOrganization = d.affiliationOrganization;
  }
  if (isEmptyText(row.affiliationLocation)) patch.affiliationLocation = d.affiliationLocation;
  if (isEmptyJsonArray(row.scholarlyProfiles)) {
    patch.scholarlyProfiles = [...d.scholarlyProfiles];
  }
  if (row.expertise == null || isEmptyRecord(row.expertise as Record<string, unknown>)) {
    patch.expertise = { ...d.expertise };
  }
  if (isEmptyText(row.collaborationInterests)) {
    patch.collaborationInterests = d.collaborationInterests;
  }

  return patch;
}

function buildHomepagePatch(
  row: typeof homepage.$inferSelect,
): Partial<typeof homepage.$inferInsert> {
  const d = homepageCompositionDefaults;
  const patch: Partial<typeof homepage.$inferInsert> = {};

  if (isEmptyText(row.heroTitle)) patch.heroTitle = d.heroTitle;
  if (isEmptyText(row.heroSubtitle)) patch.heroSubtitle = d.heroSubtitle;
  if (isEmptyText(row.heroDescriptor)) patch.heroDescriptor = d.heroDescriptor;
  if (isEmptyText(row.heroPositioning)) patch.heroPositioning = d.heroPositioning;
  if (isEmptyText(row.primaryCtaLabel)) patch.primaryCtaLabel = d.primaryCtaLabel;
  if (isEmptyText(row.primaryCtaHref)) patch.primaryCtaHref = d.primaryCtaHref;
  if (isEmptyText(row.secondaryCtaLabel)) patch.secondaryCtaLabel = d.secondaryCtaLabel;
  if (isEmptyText(row.secondaryCtaHref)) patch.secondaryCtaHref = d.secondaryCtaHref;
  if (isEmptyText(row.seoTitle)) patch.seoTitle = d.seoTitle;
  if (isEmptyText(row.seoDescription)) patch.seoDescription = d.seoDescription;
  if (isEmptyJsonArray(row.highlights)) patch.highlights = [...d.highlights];
  if (row.currentlyWorkingOn == null) {
    patch.currentlyWorkingOn = { ...d.currentlyWorkingOn };
  }
  if (row.collaborationCta == null) {
    patch.collaborationCta = { ...d.collaborationCta };
  }
  if (isEmptyJsonArray(row.profiles)) patch.profiles = [...d.profiles];
  if (isEmptySections(row.sections)) patch.sections = defaultHomeSections();

  return patch;
}

export async function seedProfileHome(db: NodePgDatabase): Promise<void> {
  const profileRow = await ensureProfileRow(db);
  const homepageRow = await ensureHomepageRow(db);

  const profileWasPristine = isProfilePristine(profileRow);
  const homepageWasPristine = isHomepagePristine(homepageRow);

  const profilePatch = buildProfilePatch(profileRow);
  const homepagePatch = buildHomepagePatch(homepageRow);

  let profileFields = Object.keys(profilePatch).length;
  let homepageFields = Object.keys(homepagePatch).length;

  if (profileFields > 0) {
    await db
      .update(profile)
      .set(profilePatch)
      .where(eq(profile.id, profileRow.id));
  }

  if (homepageFields > 0) {
    await db
      .update(homepage)
      .set(homepagePatch)
      .where(eq(homepage.id, homepageRow.id));
  }

  const now = new Date();
  let publishedProfile = false;
  let publishedHomepage = false;

  if (profileWasPristine && profileFields > 0) {
    await db
      .update(profile)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(profile.id, profileRow.id));
    publishedProfile = true;
  }

  if (homepageWasPristine && homepageFields > 0) {
    await db
      .update(homepage)
      .set({
        publishStatus: 'published',
        publishedAt: now,
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(homepage.id, homepageRow.id));
    publishedHomepage = true;
  }

  if (profileFields === 0 && homepageFields === 0 && !publishedProfile && !publishedHomepage) {
    console.log(
      'Profile/home seed skipped — singleton rows already configured (fill-empty found nothing to apply).',
    );
    return;
  }

  const parts: string[] = [];
  if (profileFields > 0) {
    parts.push(`profile ${profileFields} field${profileFields === 1 ? '' : 's'}`);
  }
  if (homepageFields > 0) {
    parts.push(`homepage ${homepageFields} field${homepageFields === 1 ? '' : 's'}`);
  }
  if (publishedProfile) parts.push('published profile');
  if (publishedHomepage) parts.push('published homepage');
  console.log(
    `Profile/home seed: ${parts.join('; ')}. Visit /, /about, and /admin/home.`,
  );
}
