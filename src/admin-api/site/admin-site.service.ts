import { Injectable } from '@nestjs/common';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import { SiteService } from '../../domain/site/site.service';

@Injectable()
export class AdminSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: ProfileHomeService,
  ) {}

  getSettings() {
    return this.site.getOrCreateSettings();
  }

  updateSettings(body: Record<string, unknown>) {
    return this.site.updateSettings(body as never);
  }

  listNav() {
    return this.site.listNav();
  }

  upsertNavItem(body: Record<string, unknown>) {
    return this.site.upsertNavItem(body as never);
  }

  updateProfile(body: Record<string, unknown>) {
    return this.profileHome.updateProfile(body as never);
  }

  updateHomepage(body: Record<string, unknown>) {
    return this.profileHome.updateHomepage(body as never);
  }
}
