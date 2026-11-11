import { Injectable } from '@nestjs/common';
import { AdminProfileHomeService } from '../profile-home/admin-profile-home.service';
import { SiteService } from '../../domain/site/site.service';

@Injectable()
export class AdminSiteService {
  constructor(
    private readonly site: SiteService,
    private readonly profileHome: AdminProfileHomeService,
  ) {}

  getSettings() {
    return this.site.getOrCreateSettings();
  }

  updateSettings(body: Parameters<SiteService['updateSettings']>[0]) {
    return this.site.updateSettings(body);
  }

  listNav() {
    return this.site.listNav();
  }

  upsertNavItem(body: Record<string, unknown>) {
    return this.site.upsertNavItem(body as never);
  }

  updateProfile(body: Record<string, unknown>) {
    return this.profileHome.updateProfileLoose(body);
  }

  updateHomepage(body: Record<string, unknown>) {
    return this.profileHome.updateHomepageLoose(body);
  }
}
