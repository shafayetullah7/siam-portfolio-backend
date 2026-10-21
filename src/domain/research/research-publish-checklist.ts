import type { ResearchThemeRow } from './research.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type ResearchPublishChecklistContext = {
  coverAlt?: string | null;
  unpublishedPublicationTitles?: string[];
  unpublishedProjectTitles?: string[];
};

export type ResearchPublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function researchPublishChecklist(
  theme: ResearchThemeRow,
  context: ResearchPublishChecklistContext = {},
): ResearchPublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(theme.title)) {
    errors.push({
      code: 'title_required',
      message: 'Title is required to publish',
    });
  }
  if (isEmpty(theme.slug)) {
    errors.push({
      code: 'slug_required',
      message: 'Slug is required to publish',
    });
  }
  if (isEmpty(theme.summary)) {
    errors.push({
      code: 'summary_required',
      message: 'Summary is required to publish',
    });
  }
  if (isEmpty(theme.problem)) {
    errors.push({
      code: 'problem_required',
      message: 'Problem is required to publish',
    });
  }
  if (theme.themeStatus === 'ongoing' && isEmpty(theme.objectives)) {
    errors.push({
      code: 'objectives_required',
      message: 'Objectives is required to publish',
    });
  }

  if (theme.themeStatus === 'ongoing' && !isEmpty(theme.findings)) {
    warnings.push({
      code: 'ongoing_has_findings',
      message:
        'Ongoing themes should emphasize objectives, not findings. Review the findings section.',
    });
  }

  if (theme.themeStatus === 'completed' && isEmpty(theme.findings)) {
    warnings.push({
      code: 'completed_missing_findings',
      message: 'Completed themes usually include findings.',
    });
  }

  if (theme.themeStatus === 'completed' && isEmpty(theme.limitations)) {
    warnings.push({
      code: 'completed_missing_limitations',
      message: 'Consider adding limitations for completed themes.',
    });
  }

  if (theme.coverMediaId && isEmpty(context.coverAlt)) {
    warnings.push({
      code: 'cover_missing_alt',
      message: 'Cover image has no alt text in the media library.',
    });
  }

  if (theme.featuredOnHome && theme.publishStatus !== 'published') {
    warnings.push({
      code: 'featured_while_unpublished',
      message:
        'This theme is marked featured on home but is not published yet.',
    });
  }

  const unpublishedPubs = context.unpublishedPublicationTitles ?? [];
  if (unpublishedPubs.length > 0) {
    const sample = unpublishedPubs.slice(0, 3).join(', ');
    const more =
      unpublishedPubs.length > 3
        ? ` (+${unpublishedPubs.length - 3} more)`
        : '';
    warnings.push({
      code: 'related_unpublished_publications',
      message: `${unpublishedPubs.length} linked publication(s) are not published: ${sample}${more}`,
    });
  }

  const unpublishedProjects = context.unpublishedProjectTitles ?? [];
  if (unpublishedProjects.length > 0) {
    const sample = unpublishedProjects.slice(0, 3).join(', ');
    const more =
      unpublishedProjects.length > 3
        ? ` (+${unpublishedProjects.length - 3} more)`
        : '';
    warnings.push({
      code: 'related_unpublished_projects',
      message: `${unpublishedProjects.length} linked project(s) are not published: ${sample}${more}`,
    });
  }

  return { errors, warnings };
}
