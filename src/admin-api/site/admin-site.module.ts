import { Module } from '@nestjs/common';
import { ProfileHomeModule } from '../../domain/profile-home/profile-home.module';
import { SiteModule } from '../../domain/site/site.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminSiteController } from './admin-site.controller';
import { AdminSiteService } from './admin-site.service';

@Module({
  imports: [AdminApiSharedModule, SiteModule, ProfileHomeModule],
  controllers: [AdminSiteController],
  providers: [AdminSiteService],
})
export class AdminSiteModule {}
