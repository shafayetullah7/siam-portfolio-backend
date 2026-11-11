import type { PublishChecklistItem, PublishChecklistResult } from './publish-checklist.types';

export type HomePublishChecklistInput = {
  heroTitle: string | null;
  heroDescriptor: string | null;
  displayName: string | null;
  headline: string | null;
  heroMediaId: string | null;
  heroMediaAlt: string | null;
  heroMediaMissing?: boolean;
  unpublishedFeaturedThemeTitles?: string[];
  unpublishedFeaturedPublicationTitles?: string[];
  unpublishedFeaturedProjectTitles?: string[];
};

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

function effectiveHeroName(input: HomePublishChecklistInput): string {
  return (
    input.heroTitle?.trim() ||
    input.displayName?.trim() ||
    input.headline?.trim() ||
    ''
  );
}

export function homePublishChecklist(
  input: HomePublishChecklistInput,
): PublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(effectiveHeroName(input))) {
    errors.push({
      code: 'HERO_NAME_REQUIRED',
      message: 'Hero needs a name (hero title, display name, or headline).',
    });
  }

  if (isEmpty(input.heroDescriptor)) {
    errors.push({
      code: 'HERO_DESCRIPTOR_REQUIRED',
      message: 'Hero descriptor is required before publishing the homepage.',
    });
  }

  if (input.heroMediaId) {
    if (input.heroMediaMissing) {
      errors.push({
        code: 'HERO_MEDIA_MISSING',
        message: 'Hero image is missing from the media library.',
      });
    } else if (isEmpty(input.heroMediaAlt)) {
      errors.push({
        code: 'HERO_MEDIA_ALT_REQUIRED',
        message: 'Hero image must have alt text in the media library.',
      });
    }
  }

  const featuredDraft: string[] = [
    ...(input.unpublishedFeaturedThemeTitles ?? []),
    ...(input.unpublishedFeaturedPublicationTitles ?? []),
    ...(input.unpublishedFeaturedProjectTitles ?? []),
  ];

  if (featuredDraft.length > 0) {
    const preview = featuredDraft.slice(0, 5).join('; ');
    const suffix =
      featuredDraft.length > 5
        ? ` (+${featuredDraft.length - 5} more)`
        : '';
    warnings.push({
      code: 'FEATURED_NOT_PUBLISHED',
      message: `Featured on home but not published: ${preview}${suffix}. Public home will omit them.`,
    });
  }

  return { errors, warnings };
}
