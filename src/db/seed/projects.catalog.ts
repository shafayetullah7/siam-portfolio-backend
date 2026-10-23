/**
 * Dev seed source for projects. Align slugs with
 * siam-frontend/src/content/projects.catalog.ts for home bounds validation.
 */
export type ProjectSectionSeed = {
  kind:
    | 'problem'
    | 'context'
    | 'responsibilities'
    | 'solution'
    | 'data_methods'
    | 'evaluation'
    | 'results'
    | 'limitations'
    | 'future_work'
    | 'custom';
  title?: string;
  body: string;
};

export type ProjectResourceSeed = {
  label: string;
  url: string;
  resourceType?:
    | 'repo'
    | 'demo'
    | 'paper'
    | 'dataset'
    | 'model_card'
    | 'documentation'
    | 'video'
    | 'other';
};

export type ProjectMetricSeed = {
  name: string;
  value: string;
  unit?: string;
  notes?: string;
};

export type ProjectSeedEntry = {
  slug: string;
  title: string;
  summary: string;
  tags?: readonly string[];
  projectType?:
    | 'research_prototype'
    | 'production'
    | 'open_source'
    | 'coursework'
    | 'competition'
    | 'other';
  projectStatus?: 'ongoing' | 'completed' | 'maintained' | 'archived';
  evaluationMaturity?: 'verified' | 'provisional' | 'experimental';
  ownerRole?: string;
  ownerContribution?: string;
  resultTeaser?: string;
  featured?: boolean;
  featuredOnHome?: boolean;
  publishStatus?: 'draft' | 'published';
  sections?: readonly ProjectSectionSeed[];
  resources?: readonly ProjectResourceSeed[];
  metrics?: readonly ProjectMetricSeed[];
  /** Link to research theme slug when both exist (R14 smoke). */
  linkThemeSlug?: string;
  /** Link to publication slugs when both exist (PROJ11 smoke). */
  linkPublicationSlugs?: readonly string[];
};

export const projectsCatalog: readonly ProjectSeedEntry[] = [
  {
    slug: 'example-open-source-project',
    title: 'Example open-source project (placeholder)',
    summary:
      'Problem, approach, and outcome in two sentences. Not a real project until content-packet approval.',
    tags: ['Python', 'ML', 'Prototype'],
    projectType: 'open_source',
    projectStatus: 'completed',
    evaluationMaturity: 'provisional',
    ownerRole: 'Lead developer',
    ownerContribution: 'Architecture, training pipeline, and evaluation harness.',
    resultTeaser: 'Reproducible baseline with documented limitations.',
    featured: true,
    featuredOnHome: true,
    publishStatus: 'published',
    sections: [
      {
        kind: 'problem',
        body:
          'Teams need a small reference implementation to test portfolio project flows without overstating results.',
      },
      {
        kind: 'solution',
        body:
          'A modular training script with configuration files and a minimal evaluation report.',
      },
      {
        kind: 'data_methods',
        body: 'Public benchmark subset; preprocessing scripts versioned in the repository.',
      },
      {
        kind: 'evaluation',
        body:
          'Held-out validation metrics with confidence intervals noted as provisional pending external review.',
      },
      {
        kind: 'results',
        body: 'Demonstrates end-to-end publish checklist: problem, evidence, and limitations present.',
      },
      {
        kind: 'limitations',
        body:
          'Placeholder copy only; metrics are illustrative until owner replaces with verified numbers.',
      },
    ],
    resources: [
      {
        label: 'Source repository',
        url: 'https://github.com/',
        resourceType: 'repo',
      },
    ],
    metrics: [
      {
        name: 'Validation accuracy',
        value: '0.82',
        unit: 'proportion',
        notes: 'Provisional — replace with verified evaluation.',
      },
    ],
    linkThemeSlug: 'interpretable-representation-learning',
    linkPublicationSlugs: ['example-publication-neurips-2025'],
  },
  {
    slug: 'second-example-project',
    title: 'Second example project (placeholder)',
    summary: 'Another featured system for the home grid.',
    tags: ['JAX', 'Research code'],
    projectType: 'research_prototype',
    projectStatus: 'maintained',
    evaluationMaturity: 'experimental',
    featuredOnHome: true,
    publishStatus: 'published',
    sections: [
      {
        kind: 'problem',
        body: 'Second stub for featured home grid and hub filters.',
      },
      {
        kind: 'limitations',
        body: 'Experimental maturity — not production hardened.',
      },
    ],
    resources: [
      {
        label: 'Repository',
        url: 'https://github.com/',
        resourceType: 'repo',
      },
    ],
  },
  {
    slug: 'coursework-prototype',
    title: 'Coursework prototype (index only)',
    summary: 'Shown on /projects but not featured on home.',
    tags: ['Coursework'],
    projectType: 'coursework',
    projectStatus: 'completed',
    evaluationMaturity: 'provisional',
    featuredOnHome: false,
    publishStatus: 'published',
    sections: [
      {
        kind: 'problem',
        body: 'Course artifact for listing smoke tests.',
      },
      {
        kind: 'limitations',
        body: 'Academic exercise — not deployed.',
      },
    ],
  },
  {
    slug: 'project-seed-draft',
    title: 'Draft project (admin only)',
    summary: 'Seeded as draft; publish from /admin/projects to appear publicly.',
    tags: ['Draft'],
    projectType: 'other',
    publishStatus: 'draft',
    sections: [
      {
        kind: 'problem',
        body: 'Draft row for admin publish workflow smoke.',
      },
    ],
  },
];
