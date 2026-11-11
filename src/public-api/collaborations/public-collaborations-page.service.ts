import { Injectable, NotFoundException } from '@nestjs/common';
import { CollaborationsService } from '../../domain/talks/collaborations.service';
import { AcademicServiceService } from '../../domain/talks/academic-service.service';
import type { CollaborationRow } from '../../domain/talks/talks.types';
import { MediaService } from '../../domain/media/media.service';
import { SiteService } from '../../domain/site/site.service';
import type { CollaborationsPageDto } from './dto/collaborations-page.dto';

@Injectable()
export class PublicCollaborationsPageService {
  constructor(
    private readonly collaborations: CollaborationsService,
    private readonly academicService: AcademicServiceService,
    private readonly site: SiteService,
    private readonly media: MediaService,
  ) {}

  private async resolveLogo(
    row: CollaborationRow,
    cache: Map<string, { url: string; alt: string } | null>,
  ): Promise<{ url: string; alt: string } | null> {
    if (!row.logoMediaId) return null;
    if (cache.has(row.logoMediaId)) {
      return cache.get(row.logoMediaId) ?? null;
    }
    try {
      const mediaRow = await this.media.findById(row.logoMediaId);
      const alt = mediaRow.alt?.trim() ?? '';
      const logo =
        alt.length > 0
          ? { url: mediaRow.url, alt }
          : null;
      cache.set(row.logoMediaId, logo);
      return logo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        cache.set(row.logoMediaId, null);
        return null;
      }
      throw error;
    }
  }

  async getPage(): Promise<CollaborationsPageDto> {
    const settings = await this.site.getOrCreateSettings();
    const [collabRows, serviceRows] = await Promise.all([
      this.collaborations.listPublishedRowsForPublic(),
      this.academicService.listPublishedPublic(),
    ]);

    const hasContent = collabRows.length + serviceRows.length > 0;
    const pageEnabled = settings.collaborationsPageEnabled && hasContent;

    if (!pageEnabled) {
      return {
        pageEnabled: false,
        intro: settings.collaborationsPageIntro ?? null,
        collaborations: [],
        service: [],
      };
    }

    const logoCache = new Map<string, { url: string; alt: string } | null>();
    const collaborations = await Promise.all(
      collabRows.map(async (row) => {
        const card = this.collaborations.toPublicCard(row);
        const logo = await this.resolveLogo(row, logoCache);
        return { ...card, logo };
      }),
    );

    return {
      pageEnabled: true,
      intro: settings.collaborationsPageIntro ?? null,
      collaborations,
      service: serviceRows,
    };
  }
}
