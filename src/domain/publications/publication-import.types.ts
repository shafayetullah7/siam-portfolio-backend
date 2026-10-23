import type { PublicationAuthorInput } from './publication-authors';
import type { PublicationType } from './publications.types';

export type PublicationImportSource = 'bibtex' | 'doi';

export type PublicationImportProposed = {
  slug: string;
  title: string;
  authors: PublicationAuthorInput[];
  year: number;
  venue: string;
  significance?: string | null;
  abstract?: string | null;
  publicationType: PublicationType;
  peerReviewed?: boolean;
  doi?: string | null;
  publisherUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export type PublicationImportDuplicateMatchReason = 'doi' | 'title_year';

export type PublicationImportDuplicate = {
  id: string;
  slug: string;
  title: string;
  year: number;
  doi: string | null;
  matchReason: PublicationImportDuplicateMatchReason;
};

export type PublicationImportPreview = {
  source: PublicationImportSource;
  proposed: PublicationImportProposed;
  duplicates: PublicationImportDuplicate[];
  parseWarnings: string[];
  lowConfidenceFields: string[];
};

export const PUBLICATION_IMPORT_MERGE_FIELDS = [
  'title',
  'authors',
  'year',
  'venue',
  'abstract',
  'significance',
  'publicationType',
  'peerReviewed',
  'doi',
  'publisherUrl',
  'seoTitle',
  'seoDescription',
] as const;

export type PublicationImportMergeField =
  (typeof PUBLICATION_IMPORT_MERGE_FIELDS)[number];
