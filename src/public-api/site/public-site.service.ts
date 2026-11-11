import { Injectable } from '@nestjs/common';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import { SiteService } from '../../domain/site/site.service';
import { PublicProjectsService } from '../projects/public-projects.service';
import { PublicPublicationsService } from '../publications/public-publications.service';
import { PublicResearchService } from '../research/public-research.service';
import { assemblePublicHome } from './public-home.assembler';
import type { PublicHomeResponse } from './public-home.types';
import type { HomePublicShell } from '../../domain/profile-home/profile-home.types';

@Injectable()
export class PublicSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: ProfileHomeService,
    private readonly publicResearch: PublicResearchService,
    private readonly publicPublications: PublicPublicationsService,
    private readonly publicProjects: PublicProjectsService,
  ) {}

  getSite() {
    return this.site.getPublicSite();
  }

  private async buildHomeResponse(input: {
    shell: HomePublicShell;
    homepagePublished: boolean;
    responsePublished?: boolean;
  }): Promise<PublicHomeResponse> {
    let researchFocus: Awaited<
      ReturnType<PublicResearchService['listFeaturedForHome']>
    > = [];
    let selectedPublications: Awaited<
      ReturnType<PublicPublicationsService['listFeaturedForHome']>
    > = [];
    let selectedProjects: Awaited<
      ReturnType<PublicProjectsService['listFeaturedForHome']>
    > = [];

    if (input.homepagePublished) {
      [researchFocus, selectedPublications, selectedProjects] =
        await Promise.all([
          this.publicResearch.listFeaturedForHome(),
          this.publicPublications.listFeaturedForHome(),
          this.publicProjects.listFeaturedForHome(),
        ]);
    }

    return assemblePublicHome({
      shell: input.shell,
      homepagePublished: input.homepagePublished,
      responsePublished: input.responsePublished,
      researchFocus,
      selectedPublications,
      selectedProjects,
    });
  }

  async getHome() {
    const [shell, homepagePublished] = await Promise.all([
      this.profileHome.getPublicHomeForSiteFacade(),
      this.profileHome.isHomepagePublished(),
    ]);
    return this.buildHomeResponse({ shell, homepagePublished });
  }

  async getHomePreviewForAdmin(): Promise<PublicHomeResponse> {
    const shell = await this.profileHome.getHomeShellDraft();
    return this.buildHomeResponse({
      shell,
      homepagePublished: true,
      responsePublished: false,
    });
  }

  async getAbout() {
    return await this.profileHome.getPublicAboutForSite();
  }
}
