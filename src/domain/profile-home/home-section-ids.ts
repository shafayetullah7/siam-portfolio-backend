/**
 * Must stay aligned with `HomeSectionId` and SECTION_ORDER in
 * `siam-frontend/src/content/home.validation.ts` (and `home.types.ts`).
 */
export const HOME_SECTION_IDS = [
  'hero',
  'affiliation',
  'researchFocus',
  'selectedPublications',
  'featuredProjects',
  'highlights',
  'currentlyWorkingOn',
  'profiles',
  'collaborationCta',
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export const MAX_HOME_SECTIONS = HOME_SECTION_IDS.length;

export function isHomeSectionId(value: string): value is HomeSectionId {
  return (HOME_SECTION_IDS as readonly string[]).includes(value);
}
