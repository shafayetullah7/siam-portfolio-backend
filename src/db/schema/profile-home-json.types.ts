/** JSON column shapes for profile/homepage — keep aligned with domain profile-home.types.ts */

export type ProfileScholarlyLink = {
  label: string;
  href: string;
  subtitle?: string;
};

/** P02 About — grouped expertise topics (no skill levels). */
export type ProfileExpertiseRow = {
  domains: string[];
  methodologies: string[];
  tooling: string[];
  practices: string[];
};

export type HomeSectionConfigRow = {
  id: string;
  visible: boolean;
};

export type HomeHighlightRow = {
  text: string;
  sourceUrl?: string;
  asOfDate?: string;
  title?: string;
  badge?: string;
  dateLabel?: string;
};

export type HomeCurrentlyWorkingOnRow = {
  text: string;
  updatedAt: string;
  headline?: string;
  statusLabel?: string;
  statusDetail?: string;
};

export type HomeCollaborationCtaRow = {
  headline: string;
  body: string;
  href: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  replyNote?: string;
};
