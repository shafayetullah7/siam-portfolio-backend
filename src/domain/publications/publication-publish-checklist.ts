import type { PublicationRow } from './publications.types';

export type PublishChecklistItem = {
  code: string;
  message: string;
};

export type PublicationPublishChecklistResult = {
  errors: PublishChecklistItem[];
  warnings: PublishChecklistItem[];
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

const PREPRINT_VENUE_PATTERN =
  /\b(arxiv|biorxiv|medrxiv|ssrn|hal\.science|preprint)\b/i;

function isEmpty(value: string | null | undefined): boolean {
  return !value?.trim();
}

export function venueLooksLikePreprint(venue: string): boolean {
  return PREPRINT_VENUE_PATTERN.test(venue.trim());
}

export function publicationPublishChecklist(
  row: PublicationRow,
): PublicationPublishChecklistResult {
  const errors: PublishChecklistItem[] = [];
  const warnings: PublishChecklistItem[] = [];

  if (isEmpty(row.title)) {
    errors.push({
      code: 'title_required',
      message: 'Title is required',
    });
  }
  if (isEmpty(row.slug)) {
    errors.push({
      code: 'slug_required',
      message: 'Slug is required',
    });
  }
  if (isEmpty(row.authorsShort)) {
    errors.push({
      code: 'authors_required',
      message: 'Authors are required',
    });
  }
  if (isEmpty(row.venue)) {
    errors.push({
      code: 'venue_required',
      message: 'Venue is required',
    });
  }
  if (
    !Number.isInteger(row.year) ||
    row.year < MIN_YEAR ||
    row.year > MAX_YEAR
  ) {
    errors.push({
      code: 'year_invalid',
      message: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
    });
  }

  if (isEmpty(row.doi)) {
    warnings.push({
      code: 'doi_missing',
      message: 'No DOI is set. Consider adding one for discoverability.',
    });
  }

  if (
    row.publicationType === 'journal' &&
    !isEmpty(row.venue) &&
    venueLooksLikePreprint(row.venue)
  ) {
    warnings.push({
      code: 'type_venue_mismatch',
      message:
        'Publication type is journal but the venue looks like a preprint server. Check type and venue.',
    });
  }

  if (
    (row.publicationType === 'journal' ||
      row.publicationType === 'conference') &&
    !row.peerReviewed
  ) {
    warnings.push({
      code: 'peer_review_unset',
      message:
        'Journal and conference entries are usually marked peer reviewed.',
    });
  }

  if (isEmpty(row.abstract)) {
    warnings.push({
      code: 'abstract_missing',
      message: 'Abstract is empty. Consider adding one before publishing.',
    });
  }

  if (row.featuredOnHome && row.publishStatus !== 'published') {
    warnings.push({
      code: 'featured_while_unpublished',
      message:
        'This publication is marked featured on home but is not published yet.',
    });
  }

  if (row.pdfMediaId && !row.pdfRightsGranted) {
    warnings.push({
      code: 'pdf_rights_missing',
      message:
        'A hosted PDF is attached but PDF rights are not confirmed. Clear the PDF or confirm rights.',
    });
  }

  return { errors, warnings };
}
