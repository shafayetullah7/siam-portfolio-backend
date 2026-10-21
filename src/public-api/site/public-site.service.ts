import { Injectable } from '@nestjs/common';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import { SiteService } from '../../domain/site/site.service';
import { PublicResearchService } from '../research/public-research.service';

@Injectable()
export class PublicSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: ProfileHomeService,
    private readonly publicResearch: PublicResearchService,
  ) {}

  getSite() {
    return this.site.getPublicSite();
  }

  async getHome() {
    const hero = await this.profileHome.getPublicHome();
    const researchFocus = await this.publicResearch.listFeaturedForHome();
    return {
      ...hero,
      researchFocus,
    };
  }

  getAbout() {
    return this.profileHome.getPublicAbout();
  }
}
