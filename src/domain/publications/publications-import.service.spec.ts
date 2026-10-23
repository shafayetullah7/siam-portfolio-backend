import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PublicationsImportService } from './publications-import.service';
import type { PublicationImportProposed } from './publication-import.types';
import { publicationRow } from './publications.service.spec';

const proposed: PublicationImportProposed = {
  slug: 'example-paper-title',
  title: 'Example Paper Title',
  authors: [{ name: 'Researcher, A.' }, { name: 'Collaborator, B.' }],
  year: 2025,
  venue: 'Example Venue',
  publicationType: 'journal',
  peerReviewed: true,
  doi: '10.0000/example',
};

function createImportService(
  publications: Record<string, unknown>,
): PublicationsImportService {
  return new PublicationsImportService(publications as never);
}

describe('PublicationsImportService', () => {
  it('previewFromBibTeX returns ordered authors', async () => {
    const service = createImportService({
      suggestUniqueSlug: vi.fn().mockResolvedValue('example-paper-title'),
      findByDoi: vi.fn().mockResolvedValue(null),
      findByTitleYear: vi.fn().mockResolvedValue([]),
    });
    const bib = `@article{x, title={T}, author={A and B}, year={2024}, journal={J}}`;
    const preview = await service.previewFromBibTeX(bib);
    expect(preview.proposed.authors.map((a) => a.name)).toEqual(['A', 'B']);
  });

  it('findDuplicateCandidates returns DOI match', async () => {
    const existing = publicationRow({ doi: '10.0000/example' });
    const service = createImportService({
      findByDoi: vi.fn().mockResolvedValue(existing),
      findByTitleYear: vi.fn().mockResolvedValue([]),
    });
    const duplicates = await service.findDuplicateCandidates(proposed);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchReason).toBe('doi');
  });

  it('confirmMerge updates only selected merge fields', async () => {
    const existing = publicationRow({
      id: '00000000-0000-4000-8000-000000000010',
      title: 'Owner title',
      abstract: 'Existing abstract',
      doi: '10.0000/existing',
    });
    const update = vi.fn().mockResolvedValue(existing);
    const service = createImportService({
      findByIdAdmin: vi.fn().mockResolvedValue(existing),
      listAuthorsForPublication: vi.fn().mockResolvedValue([
        {
          id: '1',
          publicationId: existing.id,
          sortOrder: 0,
          name: 'Owner',
          affiliation: null,
          orcid: null,
        },
      ]),
      findByDoi: vi.fn().mockResolvedValue(null),
      update,
      suggestUniqueSlug: vi.fn().mockResolvedValue('slug'),
    });

    await service.confirmMerge(
      existing.id,
      { ...proposed, title: 'Imported title', abstract: 'Imported abstract' },
      ['title'],
    );

    const patch = update.mock.calls[0][1];
    expect(patch.title).toBe('Imported title');
    expect(patch.abstract).toBeUndefined();
  });

  it('confirmMerge without title in mergeFields leaves title unchanged', async () => {
    const existing = publicationRow({
      id: '00000000-0000-4000-8000-000000000011',
      title: 'Owner title',
      abstract: null,
      doi: '10.0000/existing',
    });
    const update = vi.fn().mockResolvedValue(existing);
    const service = createImportService({
      findByIdAdmin: vi.fn().mockResolvedValue(existing),
      listAuthorsForPublication: vi.fn().mockResolvedValue([]),
      findByDoi: vi.fn().mockResolvedValue(null),
      update,
      suggestUniqueSlug: vi.fn().mockResolvedValue('slug'),
    });

    await service.confirmMerge(
      existing.id,
      { ...proposed, title: 'Imported title', abstract: 'Imported abstract' },
      ['abstract'],
    );

    const patch = update.mock.calls[0][1];
    expect(patch.title).toBeUndefined();
    expect(patch.abstract).toBe('Imported abstract');
  });

  it('confirmCreate sets draft via publications.create', async () => {
    const created = publicationRow({ publishStatus: 'draft' });
    const create = vi.fn().mockResolvedValue(created);
    const service = createImportService({
      findByDoi: vi.fn().mockResolvedValue(null),
      create,
      suggestUniqueSlug: vi.fn().mockResolvedValue('example-paper-title'),
    });

    const row = await service.confirmCreate(proposed);
    expect(row.publishStatus).toBe('draft');
    expect(create).toHaveBeenCalled();
  });

  it('confirmCreate rejects duplicate DOI', async () => {
    const service = createImportService({
      findByDoi: vi.fn().mockResolvedValue(publicationRow()),
      suggestUniqueSlug: vi.fn().mockResolvedValue('slug'),
    });
    await expect(service.confirmCreate(proposed)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
