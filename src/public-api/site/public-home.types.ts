import type { HomeSectionId } from '../../domain/profile-home/home-section-ids';
import type {
  HomeCollaborationCta,
  HomeCurrentlyWorkingOn,
  HomeHighlight,
  ScholarlyProfileLink,
} from '../../domain/profile-home/profile-home.types';
import type {
  HomeProjectHighlightPublic,
  HomePublicationHighlightPublic,
  HomeResearchFocusPublic,
} from './dto/public-home.dto';

export type PublicHomeHero = {
  name: string;
  descriptor: string;
  positioning: string;
  statusBadge?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  portrait?: { url: string; alt: string };
};

export type PublicHomeAffiliation = {
  role: string;
  organization: string;
  location?: string;
};

export type PublicHomeSeo = {
  title?: string;
  description?: string;
};

export type PublicHomeResponse = {
  published: boolean;
  visibleSectionIds: HomeSectionId[];
  /** @deprecated Use hero.name — compat for older clients */
  heroTitle: string | null;
  /** @deprecated Use hero.positioning — compat for older clients */
  heroSubtitle: string | null;
  hero?: PublicHomeHero;
  affiliation?: PublicHomeAffiliation;
  highlights?: HomeHighlight[];
  currentlyWorkingOn?: HomeCurrentlyWorkingOn;
  profiles?: ScholarlyProfileLink[];
  collaborationCta?: HomeCollaborationCta;
  seo?: PublicHomeSeo;
  researchFocus: HomeResearchFocusPublic[];
  selectedPublications?: HomePublicationHighlightPublic[];
  selectedProjects?: HomeProjectHighlightPublic[];
};

export type { PublicAboutResponse } from '../../domain/profile-home/profile-home.types';
