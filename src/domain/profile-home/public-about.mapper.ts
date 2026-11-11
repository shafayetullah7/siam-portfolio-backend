import type { profile } from '../../db/schema/profile-home';
import type { ProfileExpertise, PublicAboutResponse } from './profile-home.types';

function mapExpertisePublic(
  value: ProfileExpertise | null | undefined,
): ProfileExpertise | null {
  if (!value) return null;
  const domains = value.domains?.filter((s) => s.trim()) ?? [];
  const methodologies = value.methodologies?.filter((s) => s.trim()) ?? [];
  const tooling = value.tooling?.filter((s) => s.trim()) ?? [];
  const practices = value.practices?.filter((s) => s.trim()) ?? [];
  if (
    !domains.length &&
    !methodologies.length &&
    !tooling.length &&
    !practices.length
  ) {
    return null;
  }
  return { domains, methodologies, tooling, practices };
}

type ProfileRow = typeof profile.$inferSelect;

export const EMPTY_PUBLIC_ABOUT: PublicAboutResponse = {
  headline: null,
  shortBio: null,
  longBio: null,
  affiliation: null,
  displayName: null,
  professionalTitle: null,
  contactEmail: null,
  affiliationRole: null,
  affiliationOrganization: null,
  affiliationLocation: null,
  scholarlyProfiles: null,
  researchStatement: null,
  expertise: null,
  collaborationInterests: null,
  published: false,
};

export function mapPublicAbout(row: ProfileRow): PublicAboutResponse {
  if (row.publishStatus !== 'published') {
    return { ...EMPTY_PUBLIC_ABOUT };
  }
  return {
    headline: row.headline,
    shortBio: row.shortBio,
    longBio: row.longBio,
    affiliation: row.affiliation,
    displayName: row.displayName,
    professionalTitle: row.professionalTitle,
    contactEmail: row.contactEmail,
    affiliationRole: row.affiliationRole,
    affiliationOrganization: row.affiliationOrganization,
    affiliationLocation: row.affiliationLocation,
    scholarlyProfiles: row.scholarlyProfiles ?? null,
    researchStatement: row.researchStatement,
    expertise: mapExpertisePublic(row.expertise),
    collaborationInterests: row.collaborationInterests?.trim() || null,
    published: true,
  };
}
