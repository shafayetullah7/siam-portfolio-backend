import { Injectable } from '@nestjs/common';
import { SiteService } from '../../domain/site/site.service';
import { ProjectsService } from '../../domain/projects/projects.service';
import { PublicationsService } from '../../domain/publications/publications.service';
import { ResearchService } from '../../domain/research/research.service';
import { TalksService } from '../../domain/talks/talks.service';
import type { TalkPublicDetailDto } from './dto/talks-public-detail.dto';
import type { TalksPublicHubDto } from './dto/talks-public-hub.dto';

@Injectable()
export class PublicTalksService {
  constructor(
    private readonly talks: TalksService,
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
    private readonly research: ResearchService,
    private readonly site: SiteService,
  ) {}

  async hub(): Promise<TalksPublicHubDto> {
    const settings = await this.site.getOrCreateSettings();
    const { upcoming, past } = await this.talks.listPublicHub();
    return {
      intro: settings.talksHubIntro ?? null,
      upcoming,
      past,
    };
  }

  async getBySlug(slug: string): Promise<TalkPublicDetailDto> {
    const row = await this.talks.findPublishedBySlug(slug);
    const resources = await this.talks.listResourcesForPublic(row.id);
    const relations = await this.talks.getRelationsAdmin(row.id);

    const [publicationCards, projectCards, themeCards] = await Promise.all([
      this.publications.listPublishedCardsByIds(relations.publicationIds),
      this.projects.listPublishedCardsByIds(relations.projectIds),
      this.research.listPublishedThemeCardsByIds(relations.themeIds),
    ]);

    const base = this.talks.toPublicDetail(row, resources);
    return {
      ...base,
      related: {
        publications: publicationCards,
        projects: projectCards,
        themes: themeCards,
      },
    };
  }
}
