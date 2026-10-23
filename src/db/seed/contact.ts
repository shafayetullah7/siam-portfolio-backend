/**
 * Local/dev only — seeds contact messages and fill-empty P16 site settings.
 */
import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { contactMessages } from '../schema/contact/contact-messages';
import { siteSettings } from '../schema/site';
import {
  contactMessagesCatalog,
  contactSiteDefaults,
  type ContactMessageSeedEntry,
} from './contact.catalog';

function isEmptyText(value: string | null | undefined): boolean {
  return value == null || value.trim() === '';
}

function isEmptyCategories(
  value: string[] | null | undefined,
): boolean {
  return !Array.isArray(value) || value.length === 0;
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

async function seedContactSiteDefaults(db: NodePgDatabase): Promise<boolean> {
  const row = await ensureSiteSettingsRow(db);
  const patch: Partial<typeof siteSettings.$inferInsert> = {};

  if (isEmptyCategories(row.contactCategories)) {
    patch.contactCategories = [...contactSiteDefaults.contactCategories];
  }
  if (isEmptyText(row.contactPageIntro)) {
    patch.contactPageIntro = contactSiteDefaults.contactPageIntro;
  }
  if (isEmptyText(row.contactCollaborationGuidance)) {
    patch.contactCollaborationGuidance =
      contactSiteDefaults.contactCollaborationGuidance;
  }
  if (isEmptyText(row.contactResponseTimeNote)) {
    patch.contactResponseTimeNote = contactSiteDefaults.contactResponseTimeNote;
  }
  if (isEmptyText(row.contactConsentText)) {
    patch.contactConsentText = contactSiteDefaults.contactConsentText;
  }
  if (isEmptyText(row.contactSuccessMessage)) {
    patch.contactSuccessMessage = contactSiteDefaults.contactSuccessMessage;
  }
  if (isEmptyText(row.contactPublicEmail)) {
    patch.contactPublicEmail = contactSiteDefaults.contactPublicEmail;
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

async function seedKeyExists(
  db: NodePgDatabase,
  seedKey: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: contactMessages.id })
    .from(contactMessages)
    .where(sql`${contactMessages.metadata}->>'seedKey' = ${seedKey}`)
    .limit(1);
  return Boolean(row);
}

async function insertMessage(
  db: NodePgDatabase,
  entry: ContactMessageSeedEntry,
): Promise<void> {
  await db.insert(contactMessages).values({
    status: entry.status,
    isRead: entry.isRead,
    category: entry.category,
    senderName: entry.senderName,
    senderEmail: entry.senderEmail,
    affiliation: entry.affiliation ?? null,
    body: entry.body,
    consentGiven: entry.consentGiven,
    consentTextVersion: entry.consentTextVersion,
    submittedAt: new Date(entry.submittedAt),
    readAt: entry.readAt ? new Date(entry.readAt) : null,
    adminNotes: entry.adminNotes ?? null,
    metadata: {
      seedKey: entry.seedKey,
      userAgent: 'siam-dev-seed',
    },
  });
}

export async function seedContact(db: NodePgDatabase): Promise<void> {
  const sitePatched = await seedContactSiteDefaults(db);

  let inserted = 0;
  let skipped = 0;

  for (const entry of contactMessagesCatalog) {
    if (await seedKeyExists(db, entry.seedKey)) {
      skipped += 1;
      continue;
    }
    await insertMessage(db, entry);
    inserted += 1;
  }

  if (sitePatched) {
    console.log(
      'Contact seed: applied fill-empty P16 defaults on site_settings (categories, consent, intro).',
    );
  }
  if (inserted > 0) {
    console.log(
      `Seeded ${inserted} contact message${inserted === 1 ? '' : 's'} (${skipped} already existed). Visit /admin/messages and /contact.`,
    );
  } else if (skipped > 0) {
    console.log(`Contact messages seed skipped — ${skipped} seed key(s) already exist.`);
  }
}
