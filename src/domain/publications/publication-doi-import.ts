import { BadRequestException } from '@nestjs/common';
import type { PublicationAuthorInput } from './publication-authors';
import type { PublicationImportProposed } from './publication-import.types';
import type { PublicationType } from './publications.types';
import { slugFromTitle } from './publication-slug';

const CROSSREF_TIMEOUT_MS = 5000;
const CROSSREF_USER_AGENT = 'SIAM/1.0 (mailto:admin@siam.local)';

export function normalizeDoi(doi: string): string {
  let normalized = doi.trim();
  normalized = normalized.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
  return normalized.trim().toLowerCase();
}

type CrossrefAuthor = {
  given?: string;
  family?: string;
  name?: string;
};

type CrossrefMessage = {
  title?: string[];
  author?: CrossrefAuthor[];
  issued?: { 'date-parts'?: number[][] };
  'container-title'?: string[];
  DOI?: string;
  type?: string;
  URL?: string;
};

type CrossrefResponse = {
  message?: CrossrefMessage;
};

function authorsFromCrossref(authors: CrossrefAuthor[] | undefined): PublicationAuthorInput[] {
  if (!authors?.length) return [];
  return authors
    .map((author) => {
      if (author.name?.trim()) {
        return { name: author.name.trim() };
      }
      const given = author.given?.trim() ?? '';
      const family = author.family?.trim() ?? '';
      const name = [given, family].filter(Boolean).join(' ').trim();
      return name ? { name } : null;
    })
    .filter((a): a is PublicationAuthorInput => a != null);
}

function yearFromCrossref(message: CrossrefMessage): number | null {
  const parts = message.issued?.['date-parts']?.[0];
  const year = parts?.[0];
  if (year == null || year < 1900 || year > 2100) return null;
  return year;
}

function publicationTypeFromCrossref(type: string | undefined): PublicationType {
  const t = (type ?? '').toLowerCase();
  if (t.includes('journal')) return 'journal';
  if (t.includes('proceedings') || t === 'proceedings-article') return 'conference';
  if (t.includes('dissertation') || t.includes('thesis')) return 'thesis';
  if (t === 'posted-content' || t === 'preprint') return 'preprint';
  return 'other';
}

export function mapCrossrefToProposed(
  message: CrossrefMessage,
  doi: string,
): PublicationImportProposed {
  const title = message.title?.[0]?.trim() ?? '';
  const year = yearFromCrossref(message);
  const venue = message['container-title']?.[0]?.trim() ?? '';
  const authors = authorsFromCrossref(message.author);
  const publicationType = publicationTypeFromCrossref(message.type);

  if (!title || year == null) {
    throw new BadRequestException(
      'Crossref metadata is incomplete. Enter the publication manually.',
    );
  }

  return {
    slug: slugFromTitle(title) || 'publication',
    title,
    authors: authors.length > 0 ? authors : [{ name: 'Unknown author' }],
    year,
    venue: venue || 'Unknown venue',
    publicationType,
    peerReviewed: publicationType === 'journal',
    doi: message.DOI?.trim() || doi,
    publisherUrl: message.URL?.trim() || null,
  };
}

export type FetchCrossrefFn = (
  doi: string,
) => Promise<CrossrefResponse>;

export async function fetchCrossrefWork(
  doi: string,
  fetchFn: typeof fetch = fetch,
): Promise<CrossrefResponse> {
  const normalized = normalizeDoi(doi);
  if (!normalized) {
    throw new BadRequestException('DOI is required');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CROSSREF_TIMEOUT_MS);

  try {
    const response = await fetchFn(
      `https://api.crossref.org/works/${encodeURIComponent(normalized)}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': CROSSREF_USER_AGENT,
        },
        signal: controller.signal,
      },
    );
    if (response.status === 404) {
      throw new BadRequestException(
        'DOI not found. Check the identifier or enter the publication manually.',
      );
    }
    if (!response.ok) {
      throw new BadRequestException(
        'Could not fetch metadata for this DOI. Enter the publication manually.',
      );
    }
    return (await response.json()) as CrossrefResponse;
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(
      'Could not fetch metadata for this DOI. Enter the publication manually.',
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function parsePublicationFromDoi(
  doi: string,
  fetchFn: typeof fetch = fetch,
): Promise<{
  proposed: PublicationImportProposed;
  parseWarnings: string[];
  lowConfidenceFields: string[];
}> {
  const normalized = normalizeDoi(doi);
  const payload = await fetchCrossrefWork(normalized, fetchFn);
  const message = payload.message;
  if (!message) {
    throw new BadRequestException(
      'Invalid Crossref response. Enter the publication manually.',
    );
  }

  const proposed = mapCrossrefToProposed(message, normalized);
  const parseWarnings: string[] = [];
  const lowConfidenceFields: string[] = [];

  if (!proposed.venue || proposed.venue === 'Unknown venue') {
    parseWarnings.push('Missing venue in Crossref metadata');
    lowConfidenceFields.push('venue');
  }
  if (proposed.authors.length === 1 && proposed.authors[0].name === 'Unknown author') {
    parseWarnings.push('Missing authors in Crossref metadata');
    lowConfidenceFields.push('authors');
  }
  if (proposed.publicationType === 'other') {
    lowConfidenceFields.push('publicationType');
  }

  return { proposed, parseWarnings, lowConfidenceFields };
}
