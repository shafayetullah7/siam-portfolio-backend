import { Injectable } from '@nestjs/common';
import { PublicationsService } from '../../domain/publications/publications.service';
import type { PublicationPublicCard } from '../../domain/publications/publications.types';
import type { PublicationPublicDetail } from '../../domain/publications/publications.types';
import type { HomePublicationHighlightPublic } from '../site/dto/public-home.dto';
import type { ListPublicPublicationsQuery } from './dto/list-public-publications-query.dto';
import type { PublicationPublicListDto } from './dto/publication-public-list.dto';

@Injectable()
export class PublicPublicationsService {
  constructor(private readonly publications: PublicationsService) {}

  async list(query: ListPublicPublicationsQuery): Promise<PublicationPublicListDto> {
    const result = await this.publications.listPublishedPublic({
      q: query.q,
      year: query.year,
      publicationType: query.type,
      themeSlug: query.theme,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: result.items.map((row) => this.publications.toPublicCard(row)),
      meta: result.meta,
    };
  }

  async getBySlug(slug: string): Promise<PublicationPublicDetail> {
    const row = await this.publications.findPublishedBySlug(slug);
    return await this.publications.toPublicDetailForPublication(row, {
      includePdf: true,
    });
  }

  async getBibtex(slug: string) {
    const row = await this.publications.findPublishedBySlug(slug);
    return await this.publications.formatCitationForPublication(row);
  }

  cardToHomeHighlight(card: PublicationPublicCard): HomePublicationHighlightPublic {
    return {
      title: card.title,
      authorsShort: card.authorsShort,
      year: card.year,
      venue: card.venue,
      significance: card.significance?.trim() ?? '',
      href: card.href,
      ...(card.featured ? { featured: card.featured } : {}),
    };
  }

  async listFeaturedForHome(): Promise<HomePublicationHighlightPublic[]> {
    const rows = await this.publications.listPublishedFeaturedForHome();
    return rows.map((row) =>
      this.cardToHomeHighlight(this.publications.toPublicCard(row)),
    );
  }
}
