/**
 * Dev seed for singleton profile + homepage (M5 / HOME12).
 * Replace placeholder copy via /admin/home and docs/content-packet/identity.md.
 */
import { HOME_SECTION_IDS } from '../../domain/profile-home/home-section-ids';
import type {
  HomeCollaborationCtaRow,
  HomeCurrentlyWorkingOnRow,
  HomeHighlightRow,
  HomeSectionConfigRow,
  ProfileExpertiseRow,
  ProfileScholarlyLink,
} from '../schema/profile-home-json.types';

export type ProfileIdentitySeedDefaults = {
  displayName: string;
  professionalTitle: string;
  headline: string;
  shortBio: string;
  longBio: string;
  researchStatement: string;
  affiliation: string;
  affiliationRole: string;
  affiliationOrganization: string;
  affiliationLocation: string;
  scholarlyProfiles: readonly ProfileScholarlyLink[];
  expertise: ProfileExpertiseRow;
  collaborationInterests: string;
};

export type HomepageCompositionSeedDefaults = {
  heroTitle: string;
  heroSubtitle: string;
  heroDescriptor: string;
  heroPositioning: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  seoTitle: string;
  seoDescription: string;
  highlights: readonly HomeHighlightRow[];
  currentlyWorkingOn: HomeCurrentlyWorkingOnRow;
  collaborationCta: HomeCollaborationCtaRow;
  profiles: readonly ProfileScholarlyLink[];
};

export const profileIdentityDefaults: ProfileIdentitySeedDefaults = {
  displayName: 'Ada Lovelace',
  professionalTitle: 'Machine learning researcher',
  headline: 'Research on trustworthy and interpretable ML',
  shortBio:
    'Placeholder short bio for local dev—replace with approved copy from the content packet (max 160 characters).',
  longBio:
    'Extended narrative placeholder for the About page. Describe research themes, motivation, and selected outcomes. Replace with editorial copy from docs/content-packet/identity.md before production.',
  researchStatement:
    'Research statement placeholder: what problems you pursue, why they matter, and how your work connects to the broader ML community.',
  affiliation: 'Example University',
  affiliationRole: 'Faculty / Research staff',
  affiliationOrganization: 'Example Lab for ML Systems',
  affiliationLocation: 'City, Country',
  scholarlyProfiles: [
    {
      label: 'Google Scholar',
      href: 'https://scholar.google.com',
      subtitle: 'Publications index',
    },
    {
      label: 'ORCID',
      href: 'https://orcid.org',
      subtitle: 'Researcher ID',
    },
  ],
  expertise: {
    domains: ['Interpretable ML', 'Robustness', 'Efficient training'],
    methodologies: ['Representation learning', 'Evaluation under shift'],
    tooling: ['PyTorch', 'Experiment tracking'],
    practices: ['Open science', 'Reproducible pipelines'],
  },
  collaborationInterests:
    'Open to funded collaborations on evaluation, interpretability, and applied ML with clear scope and data agreements.',
};

export const homepageCompositionDefaults: HomepageCompositionSeedDefaults = {
  heroTitle: 'Ada Lovelace',
  heroSubtitle: 'Building reliable machine learning for real-world decisions',
  heroDescriptor: 'ML researcher',
  heroPositioning:
    'Placeholder positioning line for the home hero—replace with editorial copy that states your focus in one or two sentences.',
  primaryCtaLabel: 'Explore research',
  primaryCtaHref: '/research',
  secondaryCtaLabel: 'Get in touch',
  secondaryCtaHref: '/contact',
  seoTitle: 'Home',
  seoDescription:
    'Academic portfolio home — research themes, publications, and projects. Dev seed placeholder.',
  highlights: [
    {
      title: 'Featured insight',
      text: 'Placeholder highlight for layout testing—link a publication, talk, or blog post when ready.',
      badge: 'Update',
      dateLabel: '2026',
    },
  ],
  currentlyWorkingOn: {
    headline: 'Current focus',
    text: 'Placeholder “currently working on” blurb for the home section. Keep it factual and dated.',
    updatedAt: '2026-01-01T00:00:00.000Z',
    statusLabel: 'In progress',
    statusDetail: 'Replace before production',
  },
  collaborationCta: {
    headline: 'Interested in collaborating?',
    body: 'Share a short note about your idea, timeline, and how you would like to work together.',
    href: '/contact',
    secondaryLabel: 'View projects',
    secondaryHref: '/projects',
    replyNote: 'Typical reply within a few business days.',
  },
  profiles: [
    {
      label: 'GitHub',
      href: 'https://github.com',
      subtitle: 'Code and artifacts',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com',
      subtitle: 'Professional profile',
    },
  ],
};

export function defaultHomeSections(): HomeSectionConfigRow[] {
  return HOME_SECTION_IDS.map((id) => ({
    id,
    visible: true,
  }));
}
