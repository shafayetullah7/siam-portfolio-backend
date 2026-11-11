import type { HomeSectionId } from '../../domain/profile-home/home-section-ids';
import type { HomePublicShell } from '../../domain/profile-home/profile-home.types';
import type {
  HomeProjectHighlightPublic,
  HomePublicationHighlightPublic,
  HomeResearchFocusPublic,
} from './dto/public-home.dto';
import type {
  PublicHomeAffiliation,
  PublicHomeHero,
  PublicHomeResponse,
  PublicHomeSeo,
} from './public-home.types';

export type AssemblePublicHomeInput = {
  shell: HomePublicShell;
  homepagePublished: boolean;
  /** When set, overrides `published` on the response (preview uses false). */
  responsePublished?: boolean;
  researchFocus: HomeResearchFocusPublic[];
  selectedPublications: HomePublicationHighlightPublic[];
  selectedProjects: HomeProjectHighlightPublic[];
};

function visibleHas(visible: HomeSectionId[], id: HomeSectionId): boolean {
  return visible.includes(id);
}

function buildHero(shell: HomePublicShell): PublicHomeHero | undefined {
  const name =
    shell.displayName?.trim() || shell.heroTitle?.trim() || '';
  const descriptor = shell.heroDescriptor?.trim() ?? '';
  const positioning =
    shell.heroPositioning?.trim() || shell.heroSubtitle?.trim() || '';
  if (!name && !descriptor && !positioning) return undefined;
  return {
    name: name || ' ',
    descriptor,
    positioning,
    ...(shell.statusBadge?.trim()
      ? { statusBadge: shell.statusBadge.trim() }
      : {}),
    ...(shell.primaryCta ? { primaryCta: shell.primaryCta } : {}),
    ...(shell.secondaryCta ? { secondaryCta: shell.secondaryCta } : {}),
    ...(shell.heroPortraitUrl?.trim() && shell.heroPortraitAlt?.trim()
      ? {
          portrait: {
            url: shell.heroPortraitUrl.trim(),
            alt: shell.heroPortraitAlt.trim(),
          },
        }
      : {}),
  };
}

function buildAffiliation(shell: HomePublicShell): PublicHomeAffiliation | undefined {
  const role = shell.affiliationRole?.trim() ?? '';
  const organization = shell.affiliationOrganization?.trim() ?? '';
  if (!role || !organization) return undefined;
  return {
    role,
    organization,
    ...(shell.affiliationLocation?.trim()
      ? { location: shell.affiliationLocation.trim() }
      : {}),
  };
}

function buildSeo(shell: HomePublicShell): PublicHomeSeo | undefined {
  const title = shell.seoTitle?.trim();
  const description = shell.seoDescription?.trim();
  if (!title && !description) return undefined;
  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
  };
}

export function assemblePublicHome(
  input: AssemblePublicHomeInput,
): PublicHomeResponse {
  const { shell, homepagePublished, researchFocus, selectedPublications, selectedProjects } =
    input;

  if (!homepagePublished) {
    return {
      published: false,
      visibleSectionIds: ['hero'],
      heroTitle: null,
      heroSubtitle: null,
      researchFocus: [],
    };
  }

  const visible = shell.visibleSectionIds;
  const hero = buildHero(shell);
  const heroTitle = shell.heroTitle ?? shell.displayName ?? null;
  const heroSubtitle = shell.heroSubtitle ?? shell.heroPositioning ?? null;

  const response: PublicHomeResponse = {
    published: input.responsePublished ?? true,
    visibleSectionIds: visible,
    heroTitle,
    heroSubtitle,
    researchFocus: [],
  };

  if (hero) response.hero = hero;

  if (visibleHas(visible, 'affiliation')) {
    const affiliation = buildAffiliation(shell);
    if (affiliation) response.affiliation = affiliation;
  }

  const seo = buildSeo(shell);
  if (seo) response.seo = seo;

  if (visibleHas(visible, 'highlights') && shell.highlights?.length) {
    response.highlights = shell.highlights;
  }
  if (visibleHas(visible, 'currentlyWorkingOn') && shell.currentlyWorkingOn) {
    response.currentlyWorkingOn = shell.currentlyWorkingOn;
  }
  if (visibleHas(visible, 'profiles') && shell.profiles?.length) {
    response.profiles = shell.profiles;
  }
  if (visibleHas(visible, 'collaborationCta') && shell.collaborationCta) {
    response.collaborationCta = shell.collaborationCta;
  }

  if (visibleHas(visible, 'researchFocus') && researchFocus.length > 0) {
    response.researchFocus = researchFocus;
  }
  if (
    visibleHas(visible, 'selectedPublications') &&
    selectedPublications.length > 0
  ) {
    response.selectedPublications = selectedPublications;
  }
  if (visibleHas(visible, 'featuredProjects') && selectedProjects.length > 0) {
    response.selectedProjects = selectedProjects;
  }

  return response;
}
