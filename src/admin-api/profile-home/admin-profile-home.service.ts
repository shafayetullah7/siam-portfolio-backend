import { Injectable } from '@nestjs/common';
import {
  mapHomepageRow,
  mapProfileRow,
} from '../../domain/profile-home/profile-home.mapper';
import { ProfileHomeService } from '../../domain/profile-home/profile-home.service';
import type { PublishChecklistResult } from '../../domain/profile-home/publish-checklist.types';
import type { PublishSingletonOptions } from '../../domain/profile-home/publish-checklist.types';
import type { HomeAdminAggregate } from '../../domain/profile-home/profile-home.types';
import type { HomepageAdminRow, ProfileAdminRow } from '../../domain/profile-home/profile-home.types';
import { PublicSiteService } from '../../public-api/site/public-site.service';
import type { HomeFeaturedSummaryResponse } from '../../domain/profile-home/home-featured-summary.types';
import type { PublicHomeResponse } from '../../public-api/site/public-home.types';
import type { UpdateHomepageBody } from './dto/update-homepage.dto';
import type { UpdateProfileBody } from './dto/update-profile.dto';

@Injectable()
export class AdminProfileHomeService {
  constructor(
    private readonly profileHome: ProfileHomeService,
    private readonly publicSite: PublicSiteService,
  ) {}

  getHomeAggregate(): Promise<HomeAdminAggregate> {
    return this.profileHome.getAdminAggregate();
  }

  async getProfile(): Promise<ProfileAdminRow> {
    const aggregate = await this.profileHome.getAdminAggregate();
    return aggregate.profile;
  }

  async updateProfile(body: UpdateProfileBody): Promise<ProfileAdminRow> {
    const row = await this.profileHome.updateProfile(body);
    return mapProfileRow(row);
  }

  async updateProfileLoose(
    body: Record<string, unknown>,
  ): Promise<ProfileAdminRow> {
    const row = await this.profileHome.updateProfile(body as never);
    return mapProfileRow(row);
  }

  async updateHomepage(body: UpdateHomepageBody): Promise<HomepageAdminRow> {
    const row = await this.profileHome.updateHomepage(body);
    return mapHomepageRow(row);
  }

  async updateHomepageLoose(
    body: Record<string, unknown>,
  ): Promise<HomepageAdminRow> {
    const row = await this.profileHome.updateHomepage(body as never);
    return mapHomepageRow(row);
  }

  getHomepagePublishChecklist(): Promise<PublishChecklistResult> {
    return this.profileHome.getHomepagePublishChecklist();
  }

  async publishHomepage(
    options: PublishSingletonOptions = {},
  ): Promise<HomepageAdminRow> {
    const row = await this.profileHome.publishHomepage(options);
    return mapHomepageRow(row);
  }

  async unpublishHomepage(): Promise<HomepageAdminRow> {
    const row = await this.profileHome.unpublishHomepage();
    return mapHomepageRow(row);
  }

  getHomePreview(): Promise<PublicHomeResponse> {
    return this.publicSite.getHomePreviewForAdmin();
  }

  getFeaturedSummary(): Promise<HomeFeaturedSummaryResponse> {
    return this.profileHome.getFeaturedSummary();
  }

  getProfilePublishChecklist(): Promise<PublishChecklistResult> {
    return this.profileHome.getProfilePublishChecklist();
  }

  async publishProfile(
    options: PublishSingletonOptions = {},
  ): Promise<ProfileAdminRow> {
    const row = await this.profileHome.publishProfile(options);
    return mapProfileRow(row);
  }

  async unpublishProfile(): Promise<ProfileAdminRow> {
    const row = await this.profileHome.unpublishProfile();
    return mapProfileRow(row);
  }
}
