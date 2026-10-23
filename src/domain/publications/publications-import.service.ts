import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { parsePublicationFromBibTeX } from './publication-bibtex-import';
import {
  normalizeDoi,
  parsePublicationFromDoi,
} from './publication-doi-import';
import type {
  PublicationImportDuplicate,
  PublicationImportMergeField,
  PublicationImportPreview,
  PublicationImportProposed,
  PublicationImportSource,
} from './publication-import.types';
import { PUBLICATION_IMPORT_MERGE_FIELDS } from './publication-import.types';
import { normalizeAuthorInputs } from './publication-authors';
import { PublicationsService } from './publications.service';
import type {
  CreatePublicationInput,
  PublicationRow,
  UpdatePublicationInput,
} from './publications.types';

export type ImportConfirmInput = {
  source: PublicationImportSource;
  bibtex?: string;
  doi?: string;
  action: 'create' | 'merge';
  mergePublicationId?: string;
  mergeFields?: PublicationImportMergeField[];
  overrides?: Partial<PublicationImportProposed>;
};

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

function isEmptyString(value: string | null | undefined): boolean {
  return trimOptional(value) == null;
}

@Injectable()
export class PublicationsImportService {
  constructor(private readonly publications: PublicationsService) {}

  async previewFromBibTeX(bibtex: string): Promise<PublicationImportPreview> {
    const parsed = parsePublicationFromBibTeX(bibtex);
    const proposed = await this.withSuggestedSlug(parsed.proposed);
    const duplicates = await this.findDuplicateCandidates(proposed);
    return {
      source: 'bibtex',
      proposed,
      duplicates,
      parseWarnings: parsed.parseWarnings,
      lowConfidenceFields: parsed.lowConfidenceFields,
    };
  }

  async previewFromDoi(
    doi: string,
    fetchFn?: typeof fetch,
  ): Promise<PublicationImportPreview> {
    const parsed = await parsePublicationFromDoi(doi, fetchFn);
    const proposed = await this.withSuggestedSlug(parsed.proposed);
    const duplicates = await this.findDuplicateCandidates(proposed);
    return {
      source: 'doi',
      proposed,
      duplicates,
      parseWarnings: parsed.parseWarnings,
      lowConfidenceFields: parsed.lowConfidenceFields,
    };
  }

  async findDuplicateCandidates(
    proposed: PublicationImportProposed,
    excludeId?: string,
  ): Promise<PublicationImportDuplicate[]> {
    const results: PublicationImportDuplicate[] = [];
    const seen = new Set<string>();

    const doi = proposed.doi?.trim();
    if (doi) {
      const byDoi = await this.publications.findByDoi(doi);
      if (byDoi && byDoi.id !== excludeId && !seen.has(byDoi.id)) {
        seen.add(byDoi.id);
        results.push(this.toDuplicate(byDoi, 'doi'));
      }
    }

    const byTitleYear = await this.publications.findByTitleYear(
      proposed.title,
      proposed.year,
    );
    for (const row of byTitleYear) {
      if (row.id === excludeId || seen.has(row.id)) continue;
      seen.add(row.id);
      results.push(this.toDuplicate(row, 'title_year'));
    }

    return results;
  }

  async confirmCreate(
    proposed: PublicationImportProposed,
    overrides?: Partial<PublicationImportProposed>,
  ): Promise<PublicationRow> {
    const merged = await this.applyOverrides(proposed, overrides);
    const doiClash = merged.doi?.trim()
      ? await this.publications.findByDoi(merged.doi)
      : null;
    if (doiClash) {
      throw new ConflictException(
        'A publication with this DOI already exists. Merge into the existing record instead.',
      );
    }

    const input: CreatePublicationInput = {
      slug: merged.slug,
      title: merged.title,
      authors: merged.authors,
      year: merged.year,
      venue: merged.venue,
      significance: merged.significance ?? null,
      abstract: merged.abstract ?? null,
      publicationType: merged.publicationType,
      peerReviewed: merged.peerReviewed ?? false,
      doi: merged.doi ?? null,
      publisherUrl: merged.publisherUrl ?? null,
      seoTitle: merged.seoTitle ?? null,
      seoDescription: merged.seoDescription ?? null,
    };

    return await this.publications.create(input);
  }

  async confirmMerge(
    publicationId: string,
    proposed: PublicationImportProposed,
    mergeFields: PublicationImportMergeField[] = [],
    overrides?: Partial<PublicationImportProposed>,
  ): Promise<PublicationRow> {
    const existing = await this.publications.findByIdAdmin(publicationId);
    const authorRows = await this.publications.listAuthorsForPublication(
      publicationId,
    );
    const merged = await this.applyOverrides(proposed, overrides);
    const mergeSet = new Set(mergeFields);

    const patch: UpdatePublicationInput = {};

    if (this.shouldApplyMergeField('title', mergeSet, existing.title)) {
      patch.title = merged.title;
    }
    if (this.shouldApplyMergeField('year', mergeSet, String(existing.year))) {
      patch.year = merged.year;
    }
    if (this.shouldApplyMergeField('venue', mergeSet, existing.venue)) {
      patch.venue = merged.venue;
    }
    if (
      this.shouldApplyMergeField('abstract', mergeSet, existing.abstract ?? '')
    ) {
      patch.abstract = merged.abstract ?? null;
    }
    if (
      this.shouldApplyMergeField(
        'significance',
        mergeSet,
        existing.significance ?? '',
      )
    ) {
      patch.significance = merged.significance ?? null;
    }
    if (
      this.shouldApplyMergeField('doi', mergeSet, existing.doi ?? '') &&
      merged.doi?.trim()
    ) {
      const clash = await this.publications.findByDoi(merged.doi);
      if (clash && clash.id !== publicationId) {
        throw new ConflictException('Another publication already uses this DOI');
      }
      patch.doi = merged.doi;
    }
    if (
      this.shouldApplyMergeField(
        'publisherUrl',
        mergeSet,
        existing.publisherUrl ?? '',
      )
    ) {
      patch.publisherUrl = merged.publisherUrl ?? null;
    }
    if (
      this.shouldApplyMergeField('seoTitle', mergeSet, existing.seoTitle ?? '')
    ) {
      patch.seoTitle = merged.seoTitle ?? null;
    }
    if (
      this.shouldApplyMergeField(
        'seoDescription',
        mergeSet,
        existing.seoDescription ?? '',
      )
    ) {
      patch.seoDescription = merged.seoDescription ?? null;
    }
    if (mergeSet.has('publicationType')) {
      patch.publicationType = merged.publicationType;
    }
    if (mergeSet.has('peerReviewed')) {
      patch.peerReviewed = merged.peerReviewed ?? false;
    }
    if (
      mergeSet.has('authors') ||
      (authorRows.length === 0 && merged.authors.length > 0)
    ) {
      patch.authors = merged.authors;
    }

    return await this.publications.update(publicationId, patch);
  }

  async confirm(body: ImportConfirmInput, fetchFn?: typeof fetch) {
    const proposed = await this.resolveProposed(body, fetchFn);
    if (body.action === 'create') {
      return await this.confirmCreate(proposed, body.overrides);
    }
    if (!body.mergePublicationId) {
      throw new BadRequestException('mergePublicationId is required for merge');
    }
    const allowed = (body.mergeFields ?? []).filter((field) =>
      (PUBLICATION_IMPORT_MERGE_FIELDS as readonly string[]).includes(field),
    );
    return await this.confirmMerge(
      body.mergePublicationId,
      proposed,
      allowed,
      body.overrides,
    );
  }

  async preview(
    source: PublicationImportSource,
    options: { bibtex?: string; doi?: string },
    fetchFn?: typeof fetch,
  ): Promise<PublicationImportPreview> {
    if (source === 'bibtex') {
      if (!options.bibtex?.trim()) {
        throw new BadRequestException('bibtex is required when source is bibtex');
      }
      return await this.previewFromBibTeX(options.bibtex);
    }
    if (!options.doi?.trim()) {
      throw new BadRequestException('doi is required when source is doi');
    }
    return await this.previewFromDoi(options.doi, fetchFn);
  }

  private shouldApplyMergeField(
    _field: PublicationImportMergeField,
    mergeSet: Set<PublicationImportMergeField>,
    existingValue: string,
  ): boolean {
    if (mergeSet.has(_field)) {
      return true;
    }
    return isEmptyString(existingValue);
  }

  private async resolveProposed(
    body: ImportConfirmInput,
    fetchFn?: typeof fetch,
  ): Promise<PublicationImportProposed> {
    const preview = await this.preview(body.source, {
      bibtex: body.bibtex,
      doi: body.doi,
    }, fetchFn);
    return preview.proposed;
  }

  private async applyOverrides(
    proposed: PublicationImportProposed,
    overrides?: Partial<PublicationImportProposed>,
  ): Promise<PublicationImportProposed> {
    const merged = { ...proposed, ...overrides };
    if (overrides?.authors) {
      merged.authors = overrides.authors;
    }
    if (overrides?.doi !== undefined) {
      merged.doi = overrides.doi ? normalizeDoi(overrides.doi) : null;
    }
    normalizeAuthorInputs(merged.authors);
    merged.slug = await this.publications.suggestUniqueSlug(
      overrides?.slug ?? merged.title,
    );
    return merged;
  }

  private async withSuggestedSlug(
    proposed: PublicationImportProposed,
  ): Promise<PublicationImportProposed> {
    return {
      ...proposed,
      slug: await this.publications.suggestUniqueSlug(proposed.title),
      doi: proposed.doi ? normalizeDoi(proposed.doi) : null,
    };
  }

  private toDuplicate(
    row: PublicationRow,
    matchReason: PublicationImportDuplicate['matchReason'],
  ): PublicationImportDuplicate {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      year: row.year,
      doi: row.doi,
      matchReason,
    };
  }
}
