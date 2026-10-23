import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { buildPaginatedResponse } from '../../common/pagination/paginated-response';
import type { PaginatedResponse } from '../../common/pagination/paginated-response';
import { isPubliclyVisible } from '../../common/publishing/is-publicly-visible';
import type { PublishStatus } from '../../common/publishing/publish-status';
import { publicationAuthors } from '../../db/schema/publication-authors';
import { publicationSupplements } from '../../db/schema/publication-supplements';
import { publications } from '../../db/schema/publications';
import { MediaService } from '../media/media.service';
import { availabilityForPublication } from './publication-availability';
import { normalizeSupplementInputs } from './publication-supplements';
import {
  researchThemePublications,
  researchThemes,
} from '../../db/schema/research';
import {
  formatCitation as buildCitationStrings,
  type PublicationCitationInput,
  type PublicationCitationResult,
} from './publication-citation';
import {
  formatAuthorsShort,
  normalizeAuthorInputs,
} from './publication-authors';
import { publicationPublishChecklist } from './publication-publish-checklist';
import { assertPublishable } from './publication-publish.rules';
import { normalizeDoi } from './publication-doi-import';
import { slugFromTitle } from './publication-slug';
import type {
  CreatePublicationInput,
  ListAdminPublicationsQuery,
  ListPublishedPublicationsQuery,
  PublicationAuthor,
  PublicationAuthorPublic,
  PublicationAuthorRow,
  PublicationPdfMediaSummary,
  PublicationPublicCard,
  PublicationPublicDetail,
  PublicationRow,
  PublicationSupplement,
  PublicationSupplementPublic,
  PublicationSupplementRow,
  UpdatePublicationInput,
} from './publications.types';

const DEFAULT_LIST_LIMIT = 50;
const DEFAULT_PUBLIC_LIST_LIMIT = 24;
const MAX_LIST_LIMIT = 100;

function publicationVisibleSql(now: Date): SQL {
  return or(
    eq(publications.publishStatus, 'published'),
    and(
      eq(publications.publishStatus, 'scheduled'),
      lte(publications.scheduledAt, now),
    ),
  )!;
}

function researchThemeVisibleSql(now: Date): SQL {
  return or(
    eq(researchThemes.publishStatus, 'published'),
    and(
      eq(researchThemes.publishStatus, 'scheduled'),
      lte(researchThemes.scheduledAt, now),
    ),
  )!;
}

function trimOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t === '' ? null : t;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

@Injectable()
export class PublicationsService {
  constructor(
    @InjectDrizzle()
    private readonly db: NodePgDatabase,
    private readonly media: MediaService,
  ) {}

  hrefForSlug(slug: string): string {
    return `/publications/${slug}`;
  }

  assertPublishable(row: PublicationRow): void {
    assertPublishable(row);
  }

  toPublicCard(
    row: PublicationRow,
    options: { pdfHref?: string | null } = {},
  ): PublicationPublicCard {
    return {
      slug: row.slug,
      title: row.title,
      authorsShort: row.authorsShort,
      year: row.year,
      venue: row.venue,
      publicationType: row.publicationType,
      ...(row.significance?.trim()
        ? { significance: row.significance.trim() }
        : {}),
      ...(row.doi?.trim() ? { doi: row.doi.trim() } : {}),
      featured: row.featured,
      href: this.hrefForSlug(row.slug),
      availability: availabilityForPublication(row, {
        pdfHref: options.pdfHref,
      }),
    };
  }

  toPublicDetail(
    row: PublicationRow,
    authorRows: PublicationAuthorRow[] = [],
    supplementRows: PublicationSupplementRow[] = [],
    pdfHref?: string | null,
  ): PublicationPublicDetail {
    const card = this.toPublicCard(row, { pdfHref });
    const authors = this.mapAuthorsPublic(authorRows);
    const supplements = this.mapSupplementsPublic(supplementRows);
    return {
      ...card,
      peerReviewed: row.peerReviewed,
      ...(row.abstract?.trim() ? { abstract: row.abstract.trim() } : {}),
      ...(row.doi?.trim() ? { doi: row.doi.trim() } : {}),
      ...(row.publisherUrl?.trim()
        ? { publisherUrl: row.publisherUrl.trim() }
        : {}),
      ...(row.ownerContribution?.trim()
        ? { ownerContribution: row.ownerContribution.trim() }
        : {}),
      ...(row.correctionNotice?.trim()
        ? { correctionNotice: row.correctionNotice.trim() }
        : {}),
      ...(row.seoTitle?.trim() ? { seoTitle: row.seoTitle.trim() } : {}),
      ...(row.seoDescription?.trim()
        ? { seoDescription: row.seoDescription.trim() }
        : {}),
      ...(authors.length > 0 ? { authors } : {}),
      ...(supplements.length > 0 ? { supplements } : {}),
      ...(pdfHref?.trim() ? { pdfHref: pdfHref.trim() } : {}),
    };
  }

  mapSupplementsToAdmin(
    supplementRows: PublicationSupplementRow[],
  ): PublicationSupplement[] {
    return supplementRows.map((row) => ({
      sortOrder: row.sortOrder,
      label: row.label,
      url: row.url,
      kind: row.kind,
    }));
  }

  mapSupplementsPublic(
    supplementRows: PublicationSupplementRow[],
  ): PublicationSupplementPublic[] {
    return supplementRows.map((row) => ({
      label: row.label,
      url: row.url,
      kind: row.kind,
    }));
  }

  mapAuthorsToAdmin(authorRows: PublicationAuthorRow[]): PublicationAuthor[] {
    return authorRows.map((row) => ({
      sortOrder: row.sortOrder,
      name: row.name,
      ...(row.affiliation ? { affiliation: row.affiliation } : {}),
      ...(row.orcid ? { orcid: row.orcid } : {}),
    }));
  }

  mapAuthorsPublic(authorRows: PublicationAuthorRow[]): PublicationAuthorPublic[] {
    return authorRows.map((row) => ({
      name: row.name,
      ...(row.affiliation ? { affiliation: row.affiliation } : {}),
      ...(row.orcid ? { orcid: row.orcid } : {}),
    }));
  }

  async listAuthorsForPublication(
    publicationId: string,
  ): Promise<PublicationAuthorRow[]> {
    return await this.db
      .select()
      .from(publicationAuthors)
      .where(eq(publicationAuthors.publicationId, publicationId))
      .orderBy(asc(publicationAuthors.sortOrder));
  }

  async replaceAuthors(
    publicationId: string,
    authors: ReturnType<typeof normalizeAuthorInputs>,
  ): Promise<void> {
    await this.db
      .delete(publicationAuthors)
      .where(eq(publicationAuthors.publicationId, publicationId));
    if (authors.length === 0) return;
    await this.db.insert(publicationAuthors).values(
      authors.map((author) => ({
        publicationId,
        sortOrder: author.sortOrder,
        name: author.name,
        affiliation: author.affiliation,
        orcid: author.orcid,
      })),
    );
  }

  async resolvePdfHref(row: PublicationRow): Promise<string | undefined> {
    if (!row.pdfMediaId) return undefined;
    const mediaRow = await this.media.findById(row.pdfMediaId);
    return mediaRow.url;
  }

  async resolvePdfMediaSummary(
    pdfMediaId: string | null,
  ): Promise<PublicationPdfMediaSummary | null> {
    if (!pdfMediaId) return null;
    const mediaRow = await this.media.findById(pdfMediaId);
    return {
      id: mediaRow.id,
      fileName: mediaRow.fileName,
      url: mediaRow.url,
    };
  }

  async listSupplementsForPublication(
    publicationId: string,
  ): Promise<PublicationSupplementRow[]> {
    return await this.db
      .select()
      .from(publicationSupplements)
      .where(eq(publicationSupplements.publicationId, publicationId))
      .orderBy(asc(publicationSupplements.sortOrder));
  }

  async replaceSupplements(
    publicationId: string,
    supplements: ReturnType<typeof normalizeSupplementInputs>,
  ): Promise<void> {
    await this.db
      .delete(publicationSupplements)
      .where(eq(publicationSupplements.publicationId, publicationId));
    if (supplements.length === 0) return;
    await this.db.insert(publicationSupplements).values(
      supplements.map((row) => ({
        publicationId,
        sortOrder: row.sortOrder,
        label: row.label,
        url: row.url,
        kind: row.kind,
      })),
    );
  }

  private async resolvePdfMediaIdForWrite(
    pdfMediaId: string | null | undefined,
    pdfRightsGranted: boolean,
  ): Promise<string | null> {
    if (pdfMediaId == null || pdfMediaId === '') {
      return null;
    }
    if (!pdfRightsGranted) {
      throw new BadRequestException(
        'Confirm PDF rights before attaching a hosted PDF',
      );
    }
    await this.media.assertPdfMediaId(pdfMediaId);
    return pdfMediaId;
  }

  async toPublicDetailForPublication(
    row: PublicationRow,
    options: { includePdf?: boolean } = {},
  ): Promise<PublicationPublicDetail> {
    const authorRows = await this.listAuthorsForPublication(row.id);
    const supplementRows = await this.listSupplementsForPublication(row.id);
    const pdfHref =
      options.includePdf === true ? await this.resolvePdfHref(row) : undefined;
    return this.toPublicDetail(row, authorRows, supplementRows, pdfHref);
  }

  buildCitationInput(
    row: PublicationRow,
    authorRows: PublicationAuthorRow[],
  ): PublicationCitationInput {
    const authors =
      authorRows.length > 0
        ? authorRows.map((a) => ({ name: a.name }))
        : row.authorsShort.trim()
          ? [{ name: row.authorsShort.trim() }]
          : [];
    return {
      slug: row.slug,
      title: row.title,
      authors,
      year: row.year,
      venue: row.venue,
      publicationType: row.publicationType,
      doi: row.doi,
      peerReviewed: row.peerReviewed,
    };
  }

  formatCitation(
    row: PublicationRow,
    authorRows: PublicationAuthorRow[],
  ): PublicationCitationResult {
    return buildCitationStrings(this.buildCitationInput(row, authorRows));
  }

  async formatCitationForPublication(
    row: PublicationRow,
  ): Promise<PublicationCitationResult> {
    const authorRows = await this.listAuthorsForPublication(row.id);
    return this.formatCitation(row, authorRows);
  }

  async create(input: CreatePublicationInput): Promise<PublicationRow> {
    const normalized = normalizeAuthorInputs(input.authors);
    const authorsShort = formatAuthorsShort(normalized);
    const supplementRows = normalizeSupplementInputs(input.supplements ?? []);
    const pdfRightsGranted = input.pdfRightsGranted ?? false;
    const pdfMediaId = await this.resolvePdfMediaIdForWrite(
      input.pdfMediaId,
      pdfRightsGranted,
    );
    try {
      const row = await this.db.transaction(async (tx) => {
        const [inserted] = await tx
          .insert(publications)
          .values({
            slug: input.slug.trim(),
            title: input.title.trim(),
            authorsShort,
            year: input.year,
            venue: input.venue.trim(),
            significance: trimOptional(input.significance),
            abstract: trimOptional(input.abstract),
            publicationType: input.publicationType ?? 'other',
            peerReviewed: input.peerReviewed ?? false,
            doi: trimOptional(input.doi),
            publisherUrl: trimOptional(input.publisherUrl),
            featured: input.featured ?? false,
            featuredOnHome: input.featuredOnHome ?? false,
            seoTitle: trimOptional(input.seoTitle),
            seoDescription: trimOptional(input.seoDescription),
            ownerContribution: trimOptional(input.ownerContribution),
            correctionNotice: trimOptional(input.correctionNotice),
            hideFromSearch: input.hideFromSearch ?? false,
            pdfMediaId,
            openAccess: input.openAccess ?? false,
            pdfRightsGranted,
            publishStatus: 'draft',
          })
          .returning();
        await tx
          .delete(publicationAuthors)
          .where(eq(publicationAuthors.publicationId, inserted.id));
        await tx.insert(publicationAuthors).values(
          normalized.map((author) => ({
            publicationId: inserted.id,
            sortOrder: author.sortOrder,
            name: author.name,
            affiliation: author.affiliation,
            orcid: author.orcid,
          })),
        );
        await tx
          .delete(publicationSupplements)
          .where(eq(publicationSupplements.publicationId, inserted.id));
        if (supplementRows.length > 0) {
          await tx.insert(publicationSupplements).values(
            supplementRows.map((supplement) => ({
              publicationId: inserted.id,
              sortOrder: supplement.sortOrder,
              label: supplement.label,
              url: supplement.url,
              kind: supplement.kind,
            })),
          );
        }
        return inserted;
      });
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        const message =
          trimOptional(input.doi) != null
            ? 'Slug or DOI already exists'
            : 'Slug already exists';
        throw new ConflictException(message);
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdatePublicationInput,
  ): Promise<PublicationRow> {
    const existing = await this.findByIdAdmin(id);
    const patch: Partial<typeof publications.$inferInsert> = {};

    if (input.slug !== undefined) patch.slug = input.slug.trim();
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.authors !== undefined) {
      const normalized = normalizeAuthorInputs(input.authors);
      patch.authorsShort = formatAuthorsShort(normalized);
    }
    if (input.year !== undefined) patch.year = input.year;
    if (input.venue !== undefined) patch.venue = input.venue.trim();
    if (input.significance !== undefined) {
      patch.significance = trimOptional(input.significance);
    }
    if (input.abstract !== undefined) {
      patch.abstract = trimOptional(input.abstract);
    }
    if (input.publicationType !== undefined) {
      patch.publicationType = input.publicationType;
    }
    if (input.peerReviewed !== undefined) {
      patch.peerReviewed = input.peerReviewed;
    }
    if (input.doi !== undefined) patch.doi = trimOptional(input.doi);
    if (input.publisherUrl !== undefined) {
      patch.publisherUrl = trimOptional(input.publisherUrl);
    }
    if (input.featured !== undefined) patch.featured = input.featured;
    if (input.featuredOnHome !== undefined) {
      patch.featuredOnHome = input.featuredOnHome;
    }
    if (input.seoTitle !== undefined) {
      patch.seoTitle = trimOptional(input.seoTitle);
    }
    if (input.seoDescription !== undefined) {
      patch.seoDescription = trimOptional(input.seoDescription);
    }
    if (input.ownerContribution !== undefined) {
      patch.ownerContribution = trimOptional(input.ownerContribution);
    }
    if (input.correctionNotice !== undefined) {
      patch.correctionNotice = trimOptional(input.correctionNotice);
    }
    if (input.hideFromSearch !== undefined) {
      patch.hideFromSearch = input.hideFromSearch;
    }
    if (input.openAccess !== undefined) {
      patch.openAccess = input.openAccess;
    }
    if (input.pdfRightsGranted !== undefined) {
      patch.pdfRightsGranted = input.pdfRightsGranted;
    }
    if (
      input.pdfMediaId !== undefined ||
      input.pdfRightsGranted !== undefined
    ) {
      const nextPdfId =
        input.pdfMediaId !== undefined
          ? input.pdfMediaId
          : existing.pdfMediaId;
      const nextRights =
        input.pdfRightsGranted !== undefined
          ? input.pdfRightsGranted
          : existing.pdfRightsGranted;
      patch.pdfMediaId = await this.resolvePdfMediaIdForWrite(
        nextPdfId,
        nextRights,
      );
    }
    const supplementRows =
      input.supplements !== undefined
        ? normalizeSupplementInputs(input.supplements)
        : undefined;

    try {
      const row = await this.db.transaction(async (tx) => {
        const [updated] = await tx
          .update(publications)
          .set(patch)
          .where(eq(publications.id, id))
          .returning();
        if (!updated) {
          throw new NotFoundException('Publication not found');
        }
        if (input.authors !== undefined) {
          const normalized = normalizeAuthorInputs(input.authors);
          await tx
            .delete(publicationAuthors)
            .where(eq(publicationAuthors.publicationId, id));
          await tx.insert(publicationAuthors).values(
            normalized.map((author) => ({
              publicationId: id,
              sortOrder: author.sortOrder,
              name: author.name,
              affiliation: author.affiliation,
              orcid: author.orcid,
            })),
          );
        }
        if (supplementRows !== undefined) {
          await tx
            .delete(publicationSupplements)
            .where(eq(publicationSupplements.publicationId, id));
          if (supplementRows.length > 0) {
            await tx.insert(publicationSupplements).values(
              supplementRows.map((supplement) => ({
                publicationId: id,
                sortOrder: supplement.sortOrder,
                label: supplement.label,
                url: supplement.url,
                kind: supplement.kind,
              })),
            );
          }
        }
        return updated;
      });
      return row;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug or DOI already exists');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async findByIdAdmin(id: string): Promise<PublicationRow> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(eq(publications.id, id))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Publication not found');
    }
    return row;
  }

  async getPublishChecklist(id: string) {
    const row = await this.findByIdAdmin(id);
    return publicationPublishChecklist(row);
  }

  async publish(
    id: string,
    options: { confirmWarnings?: boolean } = {},
  ): Promise<PublicationRow> {
    const row = await this.findByIdAdmin(id);
    const checklist = publicationPublishChecklist(row);

    if (checklist.errors.length > 0) {
      throw new BadRequestException({
        message: checklist.errors.map((item) => item.message).join('; '),
        code: 'PUBLISH_BLOCKED',
        checklist,
      });
    }

    if (checklist.warnings.length > 0 && !options.confirmWarnings) {
      throw new BadRequestException({
        message: 'Confirm publish warnings before continuing',
        code: 'PUBLISH_WARNINGS',
        checklist,
      });
    }

    const [updated] = await this.db
      .update(publications)
      .set({
        publishStatus: 'published',
        publishedAt: new Date(),
        scheduledAt: null,
        archivedAt: null,
      })
      .where(eq(publications.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Publication not found');
    }
    return updated;
  }

  async unpublish(id: string): Promise<PublicationRow> {
    const [updated] = await this.db
      .update(publications)
      .set({
        publishStatus: 'draft',
        publishedAt: null,
        scheduledAt: null,
      })
      .where(eq(publications.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Publication not found');
    }
    return updated;
  }

  async schedule(id: string, scheduledAt: Date): Promise<PublicationRow> {
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(publications)
      .set({
        publishStatus: 'scheduled',
        scheduledAt,
        archivedAt: null,
      })
      .where(eq(publications.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Publication not found');
    }
    return updated;
  }

  async archive(id: string): Promise<PublicationRow> {
    await this.findByIdAdmin(id);
    const [updated] = await this.db
      .update(publications)
      .set({
        publishStatus: 'archived',
        archivedAt: new Date(),
      })
      .where(eq(publications.id, id))
      .returning();
    if (!updated) {
      throw new NotFoundException('Publication not found');
    }
    return updated;
  }

  async publishDueScheduled(now = new Date()): Promise<number> {
    const due = await this.db
      .select()
      .from(publications)
      .where(
        and(
          eq(publications.publishStatus, 'scheduled'),
          lte(publications.scheduledAt, now),
        ),
      );
    for (const row of due) {
      await this.publish(row.id);
    }
    return due.length;
  }

  async findPublishedBySlug(slug: string, now = new Date()): Promise<PublicationRow> {
    const [row] = await this.db
      .select()
      .from(publications)
      .where(eq(publications.slug, slug))
      .limit(1);
    if (!row) {
      throw new NotFoundException('Publication not found');
    }
    if (
      !isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      )
    ) {
      throw new NotFoundException('Publication not found');
    }
    return row;
  }

  async listPublished(now = new Date()): Promise<PublicationRow[]> {
    const rows = await this.db
      .select()
      .from(publications)
      .orderBy(desc(publications.year), asc(publications.title));

    return rows.filter((row) =>
      isPubliclyVisible(
        row.publishStatus as PublishStatus,
        row.scheduledAt,
        now,
      ),
    );
  }

  async listPublishedPublic(
    query: ListPublishedPublicationsQuery = {},
    now = new Date(),
  ): Promise<PaginatedResponse<PublicationRow>> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_PUBLIC_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [publicationVisibleSql(now)];

    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(publications.title, pattern),
          ilike(publications.slug, pattern),
          ilike(publications.authorsShort, pattern),
          ilike(publications.doi, pattern),
        )!,
      );
      conditions.push(eq(publications.hideFromSearch, false));
    }
    if (query.year !== undefined) {
      conditions.push(eq(publications.year, Number(query.year)));
    }
    if (query.publicationType) {
      conditions.push(eq(publications.publicationType, query.publicationType));
    }

    const whereClause = and(...conditions);
    const themeSlug = query.themeSlug?.trim();
    const orderBy = [desc(publications.year), asc(publications.title)];

    if (themeSlug) {
      const themeWhere = and(
        whereClause,
        eq(researchThemes.slug, themeSlug),
        researchThemeVisibleSql(now),
      );

      const [countRow] = await this.db
        .select({ total: count() })
        .from(publications)
        .innerJoin(
          researchThemePublications,
          eq(researchThemePublications.publicationId, publications.id),
        )
        .innerJoin(
          researchThemes,
          eq(researchThemes.id, researchThemePublications.themeId),
        )
        .where(themeWhere);

      const items = await this.db
        .select({
          publication: publications,
        })
        .from(publications)
        .innerJoin(
          researchThemePublications,
          eq(researchThemePublications.publicationId, publications.id),
        )
        .innerJoin(
          researchThemes,
          eq(researchThemes.id, researchThemePublications.themeId),
        )
        .where(themeWhere)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      const total = Number(countRow?.total ?? 0);
      return buildPaginatedResponse(
        items.map((row) => row.publication),
        { page, limit, total },
      );
    }

    const [countRow] = await this.db
      .select({ total: count() })
      .from(publications)
      .where(whereClause);

    const items = await this.db
      .select()
      .from(publications)
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset);

    const total = Number(countRow?.total ?? 0);
    return buildPaginatedResponse(items, { page, limit, total });
  }

  async listPublishedSlugs(now = new Date()): Promise<string[]> {
    const rows = await this.db
      .select({
        slug: publications.slug,
        publishStatus: publications.publishStatus,
        scheduledAt: publications.scheduledAt,
      })
      .from(publications)
      .orderBy(desc(publications.year), asc(publications.title));

    return rows
      .filter((row) =>
        isPubliclyVisible(
          row.publishStatus as PublishStatus,
          row.scheduledAt,
          now,
        ),
      )
      .map((row) => row.slug);
  }

  async listPublishedFeaturedForHome(
    limit = 4,
    now = new Date(),
  ): Promise<PublicationRow[]> {
    const published = await this.listPublished(now);
    return published.filter((row) => row.featuredOnHome).slice(0, limit);
  }

  normalizeTitleForMatch(title: string): string {
    return title.trim().toLowerCase();
  }

  async slugExists(slug: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: publications.id })
      .from(publications)
      .where(eq(publications.slug, slug))
      .limit(1);
    return row != null;
  }

  async suggestUniqueSlug(baseFromTitle: string): Promise<string> {
    const base = slugFromTitle(baseFromTitle) || 'publication';
    let candidate = base;
    let suffix = 2;
    while (await this.slugExists(candidate)) {
      const suffixPart = `-${suffix}`;
      const maxBase = Math.max(1, 200 - suffixPart.length);
      candidate = `${base.slice(0, maxBase)}${suffixPart}`;
      suffix += 1;
    }
    return candidate;
  }

  async findByDoi(doi: string): Promise<PublicationRow | null> {
    const normalized = normalizeDoi(doi);
    if (!normalized) return null;
    const [row] = await this.db
      .select()
      .from(publications)
      .where(
        sql`lower(trim(${publications.doi})) = ${normalized} AND ${publications.doi} IS NOT NULL`,
      )
      .limit(1);
    return row ?? null;
  }

  async findByTitleYear(
    title: string,
    year: number,
  ): Promise<PublicationRow[]> {
    const normalizedTitle = this.normalizeTitleForMatch(title);
    return await this.db
      .select()
      .from(publications)
      .where(
        and(
          eq(publications.year, year),
          sql`lower(trim(${publications.title})) = ${normalizedTitle}`,
        ),
      );
  }

  async duplicateHintsForRows(
    rows: PublicationRow[],
  ): Promise<Map<string, boolean>> {
    const hints = new Map<string, boolean>();
    for (const row of rows) {
      hints.set(row.id, false);
    }
    if (rows.length === 0) {
      return hints;
    }

    const dois = [
      ...new Set(
        rows
          .map((row) => (row.doi?.trim() ? normalizeDoi(row.doi) : null))
          .filter((d): d is string => d != null && d.length > 0),
      ),
    ];

    if (dois.length > 0) {
      const doiRows = await this.db
        .select()
        .from(publications)
        .where(
          or(
            ...dois.map(
              (d) => sql`lower(trim(${publications.doi})) = ${d}`,
            ),
          )!,
        );
      const byDoi = new Map<string, string[]>();
      for (const row of doiRows) {
        const key = normalizeDoi(row.doi ?? '');
        if (!key) continue;
        const ids = byDoi.get(key) ?? [];
        ids.push(row.id);
        byDoi.set(key, ids);
      }
      for (const row of rows) {
        const key = row.doi?.trim() ? normalizeDoi(row.doi) : null;
        if (key && (byDoi.get(key)?.length ?? 0) > 1) {
          hints.set(row.id, true);
        }
      }
    }

    const titleYearKeys = [
      ...new Map(
        rows.map((row) => [
          `${this.normalizeTitleForMatch(row.title)}:${row.year}`,
          { title: row.title, year: row.year },
        ]),
      ).values(),
    ];

    if (titleYearKeys.length > 0) {
      const titleYearConditions = titleYearKeys.map(
        ({ title, year }) =>
          and(
            eq(publications.year, year),
            sql`lower(trim(${publications.title})) = ${this.normalizeTitleForMatch(title)}`,
          )!,
      );
      const titleYearRows = await this.db
        .select()
        .from(publications)
        .where(or(...titleYearConditions)!);

      const byTitleYear = new Map<string, string[]>();
      for (const row of titleYearRows) {
        const key = `${this.normalizeTitleForMatch(row.title)}:${row.year}`;
        const ids = byTitleYear.get(key) ?? [];
        ids.push(row.id);
        byTitleYear.set(key, ids);
      }
      for (const row of rows) {
        const key = `${this.normalizeTitleForMatch(row.title)}:${row.year}`;
        if ((byTitleYear.get(key)?.length ?? 0) > 1) {
          hints.set(row.id, true);
        }
      }
    }

    return hints;
  }

  async listAdmin(
    query: ListAdminPublicationsQuery = {},
  ): Promise<PublicationRow[]> {
    const limit = Math.min(
      Math.max(query.limit ?? DEFAULT_LIST_LIMIT, 1),
      MAX_LIST_LIMIT,
    );
    const conditions: SQL[] = [];
    const q = query.q?.trim();
    if (q) {
      const pattern = `%${q}%`;
      conditions.push(
        or(
          ilike(publications.title, pattern),
          ilike(publications.slug, pattern),
          ilike(publications.authorsShort, pattern),
          ilike(publications.doi, pattern),
        )!,
      );
    }
    if (query.publishStatus) {
      conditions.push(eq(publications.publishStatus, query.publishStatus));
    }
    if (query.year !== undefined) {
      conditions.push(eq(publications.year, query.year));
    }
    if (query.publicationType) {
      conditions.push(eq(publications.publicationType, query.publicationType));
    }
    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    return this.db
      .select()
      .from(publications)
      .where(whereClause)
      .orderBy(asc(publications.title))
      .limit(limit);
  }

  async findManyByIds(ids: string[]): Promise<PublicationRow[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .select()
      .from(publications)
      .where(inArray(publications.id, ids));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter((row): row is PublicationRow => row != null);
  }

  async assertAllExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const rows = await this.db
      .select({ id: publications.id })
      .from(publications)
      .where(inArray(publications.id, ids));
    if (rows.length !== ids.length) {
      throw new BadRequestException('One or more publications not found');
    }
  }

  async listPublishedCardsByIds(
    ids: string[],
    now = new Date(),
  ): Promise<PublicationPublicCard[]> {
    const rows = await this.findManyByIds(ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .map((id) => byId.get(id))
      .filter(
        (row): row is PublicationRow =>
          row != null &&
          isPubliclyVisible(
            row.publishStatus as PublishStatus,
            row.scheduledAt,
            now,
          ),
      )
      .map((row) => this.toPublicCard(row));
  }

  async countPublishedForThemeIds(
    themeIds: string[],
    now = new Date(),
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    if (themeIds.length === 0) {
      return result;
    }

    const visibleCondition = or(
      eq(publications.publishStatus, 'published'),
      and(
        eq(publications.publishStatus, 'scheduled'),
        lte(publications.scheduledAt, now),
      ),
    );

    const rows = await this.db
      .select({
        themeId: researchThemePublications.themeId,
        count: count(),
      })
      .from(researchThemePublications)
      .innerJoin(
        publications,
        eq(researchThemePublications.publicationId, publications.id),
      )
      .where(
        and(inArray(researchThemePublications.themeId, themeIds), visibleCondition),
      )
      .groupBy(researchThemePublications.themeId);

    for (const row of rows) {
      result.set(row.themeId, Number(row.count));
    }
    return result;
  }
}
