import type {
  ProjectMetricRow,
  ProjectResourceRow,
  ProjectRow,
  ProjectSectionRow,
} from './projects.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type ProjectPublishChecklistContext = {
  coverAlt?: string | null;
  coverMediaMissing?: boolean;
};

export type ProjectPublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const COURSEWORK_DISCLAIMER_PATTERN =
  /\b(course|coursework|competition|academic|class project|university)\b/i;

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function sectionBodyNonEmpty(
  sections: ProjectSectionRow[],
  kind: ProjectSectionRow['kind'],
): boolean {
  return sections.some(
    (section) => section.kind === kind && !isEmpty(section.body),
  );
}

export function anyResourceHttpsInvalid(
  resources: ProjectResourceRow[],
): boolean {
  return resources.some((resource) => {
    const url = resource.url.trim();
    if (!url) return false;
    return !url.startsWith('https://');
  });
}

export function projectPublishChecklist(
  row: ProjectRow,
  sections: ProjectSectionRow[],
  resources: ProjectResourceRow[],
  metrics: ProjectMetricRow[],
  context: ProjectPublishChecklistContext = {},
): ProjectPublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.title)) {
    errors.push({ code: 'title_required', message: 'Title is required' });
  }
  const slug = row.slug.trim();
  if (!slug) {
    errors.push({ code: 'slug_required', message: 'Slug is required' });
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.push({
      code: 'slug_invalid',
      message: 'Slug must use lowercase letters, numbers, and hyphens only',
    });
  }
  if (isEmpty(row.summary)) {
    errors.push({ code: 'summary_required', message: 'Summary is required' });
  }

  if (!sectionBodyNonEmpty(sections, 'problem')) {
    errors.push({
      code: 'problem_required',
      message: 'Add a problem section before publishing',
    });
  }

  const hasLimitations = sectionBodyNonEmpty(sections, 'limitations');
  if (!hasLimitations && row.evaluationMaturity !== 'provisional') {
    errors.push({
      code: 'limitations_required',
      message: 'Add a limitations section before publishing',
    });
  }
  if (!hasLimitations && row.evaluationMaturity === 'provisional') {
    warnings.push({
      code: 'limitations_missing_provisional',
      message:
        'Provisional projects should still document limitations when possible.',
    });
  }

  const hasOwnerRole = !isEmpty(row.ownerRole);
  const hasResponsibilities = sectionBodyNonEmpty(sections, 'responsibilities');
  if (!hasOwnerRole && !hasResponsibilities) {
    errors.push({
      code: 'owner_context_required',
      message: 'Set owner role or add a responsibilities section',
    });
  }

  if (row.coverMediaId) {
    if (context.coverMediaMissing) {
      errors.push({
        code: 'cover_media_missing',
        message: 'Cover image media record was not found',
      });
    } else if (isEmpty(context.coverAlt)) {
      errors.push({
        code: 'cover_alt_required',
        message: 'Cover image must have alt text in the media library',
      });
    }
  }

  if (anyResourceHttpsInvalid(resources)) {
    errors.push({
      code: 'resource_url_invalid',
      message: 'All resource URLs must use HTTPS',
    });
  }

  const hasResults = sectionBodyNonEmpty(sections, 'results');
  const hasEvaluation = sectionBodyNonEmpty(sections, 'evaluation');
  if (hasResults && !hasEvaluation) {
    warnings.push({
      code: 'results_without_evaluation',
      message:
        'Results are present without an evaluation section. Consider adding how outcomes were measured.',
    });
  }

  const hasRepoOrDemo = resources.some(
    (r) => r.resourceType === 'repo' || r.resourceType === 'demo',
  );
  if (!hasRepoOrDemo) {
    warnings.push({
      code: 'no_repo_or_demo',
      message: 'No repository or demo link is set.',
    });
  }

  const hasEvaluationSection = sectionBodyNonEmpty(sections, 'evaluation');
  if (
    row.evaluationMaturity === 'verified' &&
    metrics.length === 0 &&
    !hasEvaluationSection
  ) {
    errors.push({
      code: 'verified_without_metrics',
      message:
        'Verified projects need at least one metric or an evaluation section with content.',
    });
  } else if (
    row.evaluationMaturity === 'verified' &&
    metrics.length > 0 &&
    !hasEvaluationSection
  ) {
    warnings.push({
      code: 'verified_metrics_without_evaluation',
      message:
        'Metrics are present without an evaluation section. Explain how outcomes were measured.',
    });
  }

  if (
    row.evaluationMaturity === 'experimental' &&
    metrics.length > 0 &&
    !hasEvaluationSection
  ) {
    warnings.push({
      code: 'experimental_metrics_without_evaluation',
      message:
        'Consider adding an evaluation section when reporting experimental metrics.',
    });
  }

  if (
    (row.projectType === 'coursework' || row.projectType === 'competition') &&
    !COURSEWORK_DISCLAIMER_PATTERN.test(row.summary)
  ) {
    warnings.push({
      code: 'coursework_disclaimer',
      message:
        'Coursework or competition projects should note academic context in the summary.',
    });
  }

  return { errors, warnings };
}
