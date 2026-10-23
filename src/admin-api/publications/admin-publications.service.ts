import { Injectable } from '@nestjs/common';
import { PublicationsImportService } from '../../domain/publications/publications-import.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import type {
  CreatePublicationInput,
  PublicationAuthorRow,
  PublicationRow,
  PublicationSupplementRow,
  UpdatePublicationInput,
} from '../../domain/publications/publications.types';
import type { CreatePublicationBody } from './dto/create-publication.dto';
import type { ListPublicationsQuery } from './dto/list-publications-query.dto';
import type { PublicationAdminResponse } from './dto/publication-admin-response.dto';
import type { PublishPublicationBody } from './dto/publish-publication.dto';
import type { UpdatePublicationBody } from './dto/update-publication.dto';
import type { ImportConfirmBody } from './dto/import-confirm-body.dto';
import type { ImportPreviewBody } from './dto/import-preview-body.dto';

@Injectable()
export class AdminPublicationsService {
  constructor(
    private readonly publications: PublicationsService,
    private readonly publicationImport: PublicationsImportService,
  ) {}

  private mapAdminBase(
    row: PublicationRow,
  ): Omit<PublicationAdminResponse, 'authors' | 'supplements'> {
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      authorsShort: row.authorsShort,
      year: row.year,
      venue: row.venue,
      significance: row.significance,
      abstract: row.abstract,
      publicationType: row.publicationType,
      peerReviewed: row.peerReviewed,
      doi: row.doi,
      publisherUrl: row.publisherUrl,
      featured: row.featured,
      featuredOnHome: row.featuredOnHome,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
      ownerContribution: row.ownerContribution,
      correctionNotice: row.correctionNotice,
      hideFromSearch: row.hideFromSearch,
      pdfMediaId: row.pdfMediaId,
      openAccess: row.openAccess,
      pdfRightsGranted: row.pdfRightsGranted,
      publishStatus: row.publishStatus,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      scheduledAt: row.scheduledAt?.toISOString() ?? null,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapAdmin(
    row: PublicationRow,
    authorRows: PublicationAuthorRow[] = [],
    supplementRows: PublicationSupplementRow[] = [],
    pdfMedia: PublicationAdminResponse['pdfMedia'] = null,
  ): PublicationAdminResponse {
    return {
      ...this.mapAdminBase(row),
      authors: this.publications.mapAuthorsToAdmin(authorRows),
      supplements: this.publications.mapSupplementsToAdmin(supplementRows),
      ...(pdfMedia ? { pdfMedia } : {}),
    };
  }

  private async mapAdminWithAuthors(
    row: PublicationRow,
  ): Promise<PublicationAdminResponse> {
    const authorRows = await this.publications.listAuthorsForPublication(row.id);
    const supplementRows =
      await this.publications.listSupplementsForPublication(row.id);
    const pdfMedia = await this.publications.resolvePdfMediaSummary(
      row.pdfMediaId,
    );
    return this.mapAdmin(row, authorRows, supplementRows, pdfMedia);
  }

  private toCreateInput(body: CreatePublicationBody): CreatePublicationInput {
    return { ...body };
  }

  private toUpdateInput(body: UpdatePublicationBody): UpdatePublicationInput {
    return { ...body };
  }

  async list(query: ListPublicationsQuery) {
    const rows = await this.publications.listAdmin({
      q: query.q,
      publishStatus: query.publishStatus,
      year: query.year,
      publicationType: query.publicationType,
      limit: query.limit,
    });
    const duplicateHints = await this.publications.duplicateHintsForRows(rows);
    return rows.map((row) => ({
      ...this.mapAdmin(row, []),
      ...(duplicateHints.get(row.id)
        ? { duplicateHint: true as const }
        : {}),
    }));
  }

  async get(id: string) {
    const row = await this.publications.findByIdAdmin(id);
    return await this.mapAdminWithAuthors(row);
  }

  async preview(id: string) {
    const row = await this.publications.findByIdAdmin(id);
    return await this.publications.toPublicDetailForPublication(row, {
      includePdf: true,
    });
  }

  async citation(id: string) {
    const row = await this.publications.findByIdAdmin(id);
    return await this.publications.formatCitationForPublication(row);
  }

  async getPublishCheck(id: string) {
    return await this.publications.getPublishChecklist(id);
  }

  async create(body: CreatePublicationBody) {
    const row = await this.publications.create(this.toCreateInput(body));
    return await this.mapAdminWithAuthors(row);
  }

  async update(id: string, body: UpdatePublicationBody) {
    const row = await this.publications.update(id, this.toUpdateInput(body));
    return await this.mapAdminWithAuthors(row);
  }

  async publish(id: string, body: PublishPublicationBody = {}) {
    const row = await this.publications.publish(id, {
      confirmWarnings: body.confirmWarnings,
    });
    return await this.mapAdminWithAuthors(row);
  }

  async unpublish(id: string) {
    const row = await this.publications.unpublish(id);
    return await this.mapAdminWithAuthors(row);
  }

  async archive(id: string) {
    const row = await this.publications.archive(id);
    return await this.mapAdminWithAuthors(row);
  }

  async schedule(id: string, scheduledAt: Date) {
    const row = await this.publications.schedule(id, scheduledAt);
    return await this.mapAdminWithAuthors(row);
  }

  async importPreview(body: ImportPreviewBody) {
    const preview = await this.publicationImport.preview(body.source, {
      bibtex: body.bibtex,
      doi: body.doi,
    });
    return preview;
  }

  async importConfirm(body: ImportConfirmBody) {
    const row = await this.publicationImport.confirm({
      source: body.source,
      bibtex: body.bibtex,
      doi: body.doi,
      action: body.action,
      mergePublicationId: body.mergePublicationId,
      mergeFields: body.mergeFields,
      overrides: body.overrides,
    });
    return await this.mapAdminWithAuthors(row);
  }
}
