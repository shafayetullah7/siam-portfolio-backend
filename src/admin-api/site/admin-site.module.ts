import { Module } from '@nestjs/common';
import { SiteModule } from '../../domain/site/site.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminProfileHomeModule } from '../profile-home/admin-profile-home.module';
import { AdminSiteController } from './admin-site.controller';
import { AdminSiteService } from './admin-site.service';

@Module({
  imports: [AdminApiSharedModule, SiteModule, AdminProfileHomeModule],
  controllers: [AdminSiteController],
  providers: [AdminSiteService],
})
export class AdminSiteModule {}
