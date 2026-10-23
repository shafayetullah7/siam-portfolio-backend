import { Injectable } from '@nestjs/common';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import { SiteService } from '../../domain/site/site.service';
import { PublicPublicationsService } from '../publications/public-publications.service';
import { PublicResearchService } from '../research/public-research.service';

@Injectable()
export class PublicSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: ProfileHomeService,
    private readonly publicResearch: PublicResearchService,
    private readonly publicPublications: PublicPublicationsService,
  ) {}

  getSite() {
    return this.site.getPublicSite();
  }

  async getHome() {
    const hero = await this.profileHome.getPublicHome();
    const [researchFocus, selectedPublications] = await Promise.all([
      this.publicResearch.listFeaturedForHome(),
      this.publicPublications.listFeaturedForHome(),
    ]);
    return {
      ...hero,
      researchFocus,
      ...(selectedPublications.length > 0
        ? { selectedPublications }
        : {}),
    };
  }

  getAbout() {
    return this.profileHome.getPublicAbout();
  }
}
