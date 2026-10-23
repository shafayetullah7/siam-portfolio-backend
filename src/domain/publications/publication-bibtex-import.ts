import { BadRequestException } from '@nestjs/common';
import { parse as parseBibtex } from 'bibtex-parse';
import type { PublicationAuthorInput } from './publication-authors';
import type { PublicationImportProposed } from './publication-import.types';
import type { PublicationType } from './publications.types';
import { slugFromTitle } from './publication-slug';

type BibtexField = {
  name: string;
  value: string;
};

type BibtexEntry = {
  itemtype: string;
  type?: string;
  fields?: BibtexField[];
};

export type BibtexParseResult = {
  proposed: PublicationImportProposed;
  parseWarnings: string[];
  lowConfidenceFields: string[];
};

function fieldMap(entry: BibtexEntry): Map<string, string> {
  const map = new Map<string, string>();
  for (const field of entry.fields ?? []) {
    const name = field.name?.toLowerCase();
    if (!name) continue;
    const value = field.value?.trim() ?? '';
    if (value) {
      map.set(name, value);
    }
  }
  return map;
}

function parseAuthors(raw: string | undefined): PublicationAuthorInput[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(/\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function publicationTypeFromBibtexEntry(
  entryType: string | undefined,
): { type: PublicationType; lowConfidence: boolean } {
  const t = (entryType ?? '').toLowerCase();
  switch (t) {
    case 'article':
      return { type: 'journal', lowConfidence: false };
    case 'inproceedings':
    case 'conference':
      return { type: 'conference', lowConfidence: false };
    case 'inbook':
    case 'incollection':
      return { type: 'conference', lowConfidence: true };
    case 'phdthesis':
    case 'mastersthesis':
      return { type: 'thesis', lowConfidence: false };
    case 'unpublished':
    case 'misc':
      return { type: 'preprint', lowConfidence: true };
    default:
      return { type: 'other', lowConfidence: true };
  }
}

function parseYear(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const match = raw.trim().match(/\d{4}/);
  if (!match) return null;
  const year = Number.parseInt(match[0], 10);
  if (year < 1900 || year > 2100) return null;
  return year;
}

function normalizeDoiFromBibtex(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  let doi = raw.trim();
  doi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return doi.trim() || null;
}

export function parsePublicationFromBibTeX(bibtex: string): BibtexParseResult {
  const trimmed = bibtex.trim();
  if (!trimmed) {
    throw new BadRequestException('BibTeX input is required');
  }

  let items: BibtexEntry[];
  try {
    items = parseBibtex(trimmed) as BibtexEntry[];
  } catch {
    throw new BadRequestException(
      'Could not parse BibTeX. Check the entry syntax or enter the publication manually.',
    );
  }

  const entry = items.find((item) => item.itemtype === 'entry');
  if (!entry) {
    throw new BadRequestException(
      'No BibTeX entry found. Paste a single @article, @inproceedings, or similar entry.',
    );
  }

  const fields = fieldMap(entry);
  const title = fields.get('title') ?? '';
  const authors = parseAuthors(fields.get('author'));
  const year = parseYear(fields.get('year'));
  const venue =
    fields.get('journal') ??
    fields.get('booktitle') ??
    fields.get('school') ??
    '';
  const doi = normalizeDoiFromBibtex(fields.get('doi'));
  const { type: publicationType, lowConfidence: typeLowConfidence } =
    publicationTypeFromBibtexEntry(entry.type);

  const parseWarnings: string[] = [];
  const lowConfidenceFields: string[] = [];
  if (!title) parseWarnings.push('Missing title');
  if (year == null) parseWarnings.push('Missing or invalid year');
  if (!venue.trim()) parseWarnings.push('Missing venue (journal or booktitle)');
  if (authors.length === 0) parseWarnings.push('Missing authors');
  if (typeLowConfidence) lowConfidenceFields.push('publicationType');

  if (!title || year == null) {
    throw new BadRequestException({
      message:
        'BibTeX entry is missing required fields (title and year). Fix the entry or use manual entry.',
      parseWarnings,
      lowConfidenceFields,
    });
  }

  const proposed: PublicationImportProposed = {
    slug: slugFromTitle(title) || 'publication',
    title,
    authors:
      authors.length > 0 ? authors : [{ name: 'Unknown author' }],
    year,
    venue: venue.trim() || 'Unknown venue',
    publicationType,
    peerReviewed: publicationType === 'journal',
    doi,
  };

  if (authors.length === 0) {
    lowConfidenceFields.push('authors');
  }
  if (!venue.trim()) {
    lowConfidenceFields.push('venue');
  }

  return { proposed, parseWarnings, lowConfidenceFields };
}
