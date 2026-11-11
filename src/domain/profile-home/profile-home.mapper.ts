import type { homepage, profile } from '../../db/schema/profile-home';
import { resolveVisibleSectionIds, sectionsOrDefault } from './home-sections';
import type {
  HomeAdminAggregate,
  HomePublicShell,
  HomepageAdminRow,
  ProfileAdminRow,
} from './profile-home.types';

type ProfileRow = typeof profile.$inferSelect;
type HomepageRow = typeof homepage.$inferSelect;

export function mapProfileRow(row: ProfileRow): ProfileAdminRow {
  return {
    id: row.id,
    headline: row.headline,
    displayName: row.displayName,
    professionalTitle: row.professionalTitle,
    contactEmail: row.contactEmail,
    shortBio: row.shortBio,
    longBio: row.longBio,
    affiliation: row.affiliation,
    affiliationRole: row.affiliationRole,
    affiliationOrganization: row.affiliationOrganization,
    affiliationLocation: row.affiliationLocation,
    portraitMediaId: row.portraitMediaId,
    scholarlyProfiles: row.scholarlyProfiles ?? null,
    researchStatement: row.researchStatement,
    expertise: row.expertise ?? null,
    collaborationInterests: row.collaborationInterests,
    publishStatus: row.publishStatus,
    publishedAt: row.publishedAt,
    scheduledAt: row.scheduledAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapHomepageRow(row: HomepageRow): HomepageAdminRow {
  const sections = row.sections?.length
    ? sectionsOrDefault(row.sections)
    : null;
  return {
    id: row.id,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroDescriptor: row.heroDescriptor,
    heroPositioning: row.heroPositioning,
    statusBadge: row.statusBadge,
    primaryCtaLabel: row.primaryCtaLabel,
    primaryCtaHref: row.primaryCtaHref,
    secondaryCtaLabel: row.secondaryCtaLabel,
    secondaryCtaHref: row.secondaryCtaHref,
    heroMediaId: row.heroMediaId,
    sections,
    highlights: row.highlights ?? null,
    currentlyWorkingOn: row.currentlyWorkingOn ?? null,
    collaborationCta: row.collaborationCta ?? null,
    profiles: row.profiles ?? null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishStatus: row.publishStatus,
    publishedAt: row.publishedAt,
    scheduledAt: row.scheduledAt,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapAdminAggregate(
  profileRow: ProfileRow,
  homepageRow: HomepageRow,
): HomeAdminAggregate {
  return {
    profile: mapProfileRow(profileRow),
    homepage: mapHomepageRow(homepageRow),
  };
}

function primaryCta(row: HomepageRow) {
  const label = row.primaryCtaLabel?.trim();
  const href = row.primaryCtaHref?.trim();
  if (label && href) return { label, href };
  return null;
}

function secondaryCta(row: HomepageRow) {
  const label = row.secondaryCtaLabel?.trim();
  const href = row.secondaryCtaHref?.trim();
  if (label && href) return { label, href };
  return null;
}

export function mapHomePublicShell(
  profileRow: ProfileRow,
  homepageRow: HomepageRow,
): HomePublicShell {
  const sections = sectionsOrDefault(homepageRow.sections);
  const heroPositioning =
    homepageRow.heroPositioning?.trim() ||
    homepageRow.heroSubtitle?.trim() ||
    null;
  const heroDescriptor = homepageRow.heroDescriptor?.trim() || null;
  const heroTitle =
    homepageRow.heroTitle?.trim() ||
    profileRow.displayName?.trim() ||
    profileRow.headline?.trim() ||
    null;

  return {
    heroTitle,
    heroSubtitle: homepageRow.heroSubtitle,
    heroDescriptor,
    heroPositioning,
    statusBadge: homepageRow.statusBadge,
    primaryCta: primaryCta(homepageRow),
    secondaryCta: secondaryCta(homepageRow),
    displayName:
      profileRow.displayName?.trim() || profileRow.headline?.trim() || null,
    affiliationRole: profileRow.affiliationRole,
    affiliationOrganization: profileRow.affiliationOrganization,
    affiliationLocation: profileRow.affiliationLocation,
    visibleSectionIds: resolveVisibleSectionIds(sections),
    highlights: homepageRow.highlights ?? null,
    currentlyWorkingOn: homepageRow.currentlyWorkingOn ?? null,
    collaborationCta: homepageRow.collaborationCta ?? null,
    profiles: homepageRow.profiles ?? null,
    seoTitle: homepageRow.seoTitle,
    seoDescription: homepageRow.seoDescription,
    heroPortraitUrl: null,
    heroPortraitAlt: null,
  };
}
