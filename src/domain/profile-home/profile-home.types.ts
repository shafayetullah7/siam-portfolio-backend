import type { HomeSectionId } from './home-section-ids';

export type HomeSectionConfig = {
  id: HomeSectionId;
  visible: boolean;
};

export type ScholarlyProfileLink = {
  label: string;
  href: string;
  subtitle?: string;
};

export type ProfileExpertise = {
  domains: string[];
  methodologies: string[];
  tooling: string[];
  practices: string[];
};

export type HomeHighlight = {
  text: string;
  sourceUrl?: string;
  asOfDate?: string;
  title?: string;
  badge?: string;
  dateLabel?: string;
};

export type HomeCurrentlyWorkingOn = {
  text: string;
  updatedAt: string;
  headline?: string;
  statusLabel?: string;
  statusDetail?: string;
};

export type HomeCollaborationCta = {
  headline: string;
  body: string;
  href: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  replyNote?: string;
};

export type ProfileAdminRow = {
  id: string;
  headline: string | null;
  displayName: string | null;
  professionalTitle: string | null;
  contactEmail: string | null;
  shortBio: string | null;
  longBio: string | null;
  affiliation: string | null;
  affiliationRole: string | null;
  affiliationOrganization: string | null;
  affiliationLocation: string | null;
  portraitMediaId: string | null;
  scholarlyProfiles: ScholarlyProfileLink[] | null;
  researchStatement: string | null;
  expertise: ProfileExpertise | null;
  collaborationInterests: string | null;
  publishStatus: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HomepageAdminRow = {
  id: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroDescriptor: string | null;
  heroPositioning: string | null;
  statusBadge: string | null;
  primaryCtaLabel: string | null;
  primaryCtaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  heroMediaId: string | null;
  sections: HomeSectionConfig[] | null;
  highlights: HomeHighlight[] | null;
  currentlyWorkingOn: HomeCurrentlyWorkingOn | null;
  collaborationCta: HomeCollaborationCta | null;
  profiles: ScholarlyProfileLink[] | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishStatus: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type HomePublicShell = {
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroDescriptor: string | null;
  heroPositioning: string | null;
  statusBadge: string | null;
  primaryCta: { label: string; href: string } | null;
  secondaryCta: { label: string; href: string } | null;
  displayName: string | null;
  affiliationRole: string | null;
  affiliationOrganization: string | null;
  affiliationLocation: string | null;
  visibleSectionIds: HomeSectionId[];
  highlights: HomeHighlight[] | null;
  currentlyWorkingOn: HomeCurrentlyWorkingOn | null;
  collaborationCta: HomeCollaborationCta | null;
  profiles: ScholarlyProfileLink[] | null;
  seoTitle: string | null;
  seoDescription: string | null;
  /** Resolved public hero image (heroMedia overrides portrait). */
  heroPortraitUrl: string | null;
  heroPortraitAlt: string | null;
};

export type HomeAdminAggregate = {
  profile: ProfileAdminRow;
  homepage: HomepageAdminRow;
};

export type PublicAboutResponse = {
  headline: string | null;
  shortBio: string | null;
  longBio: string | null;
  affiliation: string | null;
  displayName: string | null;
  professionalTitle: string | null;
  contactEmail: string | null;
  affiliationRole: string | null;
  affiliationOrganization: string | null;
  affiliationLocation: string | null;
  scholarlyProfiles: ScholarlyProfileLink[] | null;
  researchStatement: string | null;
  expertise: ProfileExpertise | null;
  collaborationInterests: string | null;
  published: boolean;
};

export const EMPTY_HOME_PUBLIC_SHELL: HomePublicShell = {
  heroTitle: null,
  heroSubtitle: null,
  heroDescriptor: null,
  heroPositioning: null,
  statusBadge: null,
  primaryCta: null,
  secondaryCta: null,
  displayName: null,
  affiliationRole: null,
  affiliationOrganization: null,
  affiliationLocation: null,
  visibleSectionIds: ['hero'],
  highlights: null,
  currentlyWorkingOn: null,
  collaborationCta: null,
  profiles: null,
  seoTitle: null,
  seoDescription: null,
  heroPortraitUrl: null,
  heroPortraitAlt: null,
};
