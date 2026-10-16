import { Injectable } from '@nestjs/common';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import { SiteService } from '../../domain/site/site.service';

@Injectable()
export class PublicSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: ProfileHomeService,
  ) {}

  getSite() {
    return this.site.getPublicSite();
  }

  getHome() {
    return this.profileHome.getPublicHome();
  }

  getAbout() {
    return this.profileHome.getPublicAbout();
  }
}
