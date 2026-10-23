import { describe, expect, it } from 'vitest';
import { projectPublishChecklist } from './project-publish-checklist';
import type {
  ProjectMetricRow,
  ProjectResourceRow,
  ProjectRow,
  ProjectSectionRow,
} from './projects.types';

function baseRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'id-1',
    slug: 'my-project',
    title: 'Title',
    summary: 'Summary for a university course project.',
    tags: null,
    projectType: 'other',
    projectStatus: 'completed',
    evaluationMaturity: 'provisional',
    ownerRole: 'Lead engineer',
    ownerContribution: null,
    resultTeaser: null,
    periodStart: null,
    periodEnd: null,
    coverMediaId: null,
    featured: false,
    featuredOnHome: false,
    sortOrder: 0,
    seoTitle: null,
    seoDescription: null,
    hideFromSearch: false,
    publishStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function section(
  kind: ProjectSectionRow['kind'],
  body: string,
): ProjectSectionRow {
  return {
    id: 's1',
    projectId: 'id-1',
    sortOrder: 0,
    kind,
    title: null,
    body,
  };
}

const minimalSections = [
  section('problem', 'Problem text'),
  section('limitations', 'Limits'),
];

describe('projectPublishChecklist', () => {
  it('flags missing problem section', () => {
    const result = projectPublishChecklist(
      baseRow(),
      [section('limitations', 'L')],
      [],
      [],
    );
    expect(result.errors.some((e) => e.code === 'problem_required')).toBe(
      true,
    );
  });

  it('requires limitations when not provisional', () => {
    const result = projectPublishChecklist(
      baseRow({ evaluationMaturity: 'verified' }),
      [section('problem', 'P')],
      [],
      [],
    );
    expect(result.errors.some((e) => e.code === 'limitations_required')).toBe(
      true,
    );
  });

  it('warns when provisional without limitations', () => {
    const result = projectPublishChecklist(
      baseRow({ evaluationMaturity: 'provisional' }),
      [section('problem', 'P')],
      [],
      [],
    );
    expect(
      result.warnings.some((w) => w.code === 'limitations_missing_provisional'),
    ).toBe(true);
    expect(result.errors.some((e) => e.code === 'limitations_required')).toBe(
      false,
    );
  });

  it('errors when verified without metrics or evaluation section', () => {
    const result = projectPublishChecklist(
      baseRow({ evaluationMaturity: 'verified' }),
      minimalSections,
      [],
      [],
    );
    expect(
      result.errors.some((e) => e.code === 'verified_without_metrics'),
    ).toBe(true);
  });

  it('allows verified with evaluation section and no metrics', () => {
    const result = projectPublishChecklist(
      baseRow({ evaluationMaturity: 'verified' }),
      [...minimalSections, section('evaluation', 'We measured accuracy.')],
      [],
      [],
    );
    expect(
      result.errors.some((e) => e.code === 'verified_without_metrics'),
    ).toBe(false);
  });

  it('blocks publish when cover is set without alt text', () => {
    const result = projectPublishChecklist(
      baseRow({ coverMediaId: 'media-1' }),
      minimalSections,
      [],
      [],
      { coverAlt: '', coverMediaMissing: false },
    );
    expect(result.errors.some((e) => e.code === 'cover_alt_required')).toBe(
      true,
    );
  });
});
