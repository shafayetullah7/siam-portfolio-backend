/**
 * Dev seed source for publications. Align with
 * docs/content-packet/publications.bib and siam-frontend/src/content/publications.catalog.ts.
 */
export type PublicationAuthorSeed = {
  name: string;
  affiliation?: string;
};

export type PublicationSeedEntry = {
  slug: string;
  title: string;
  year: number;
  venue: string;
  authors: readonly PublicationAuthorSeed[];
  significance?: string;
  abstract?: string;
  publicationType?:
    | 'journal'
    | 'conference'
    | 'preprint'
    | 'workshop'
    | 'thesis'
    | 'other';
  peerReviewed?: boolean;
  doi?: string;
  featuredOnHome?: boolean;
  featured?: boolean;
  /** Seed as published for public list/sitemap demos. */
  publishStatus?: 'draft' | 'published';
  /** Link to research theme slug when both exist (R13 smoke). */
  linkThemeSlug?: string;
};

export const publicationsCatalog: readonly PublicationSeedEntry[] = [
  {
    slug: 'example-publication-neurips-2025',
    title: 'Example publication title (placeholder)',
    year: 2025,
    venue: 'NeurIPS',
    authors: [{ name: 'Author A' }, { name: 'Author B' }],
    significance:
      'One sentence on why this work matters—replace with verified copy from the content packet.',
    abstract:
      'Extended abstract placeholder for the publication detail stub. Replace with approved abstract or omit.',
    publicationType: 'conference',
    peerReviewed: true,
    doi: '10.0000/example',
    featuredOnHome: true,
    featured: true,
    publishStatus: 'published',
    linkThemeSlug: 'interpretable-representation-learning',
  },
  {
    slug: 'second-example-icml-2024',
    title: 'Second example publication (placeholder)',
    year: 2024,
    venue: 'ICML',
    authors: [{ name: 'Author A' }, { name: 'Collaborator C' }],
    significance: 'Significance line for layout testing only.',
    publicationType: 'conference',
    peerReviewed: true,
    featuredOnHome: true,
    publishStatus: 'published',
  },
  {
    slug: 'workshop-paper-facct-2024',
    title: 'Workshop paper (not on home)',
    authors: [{ name: 'Author A' }, { name: 'Collaborator B' }],
    year: 2024,
    venue: 'FAccT Workshop',
    significance: 'Additional catalog entry for full publications index.',
    publicationType: 'workshop',
    featuredOnHome: false,
    publishStatus: 'draft',
  },
];
