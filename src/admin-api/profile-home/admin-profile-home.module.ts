import { Module } from '@nestjs/common';
import { ProfileHomeModule } from '../../domain/profile-home/profile-home.module';
import { PublicSiteModule } from '../../public-api/site/public-site.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminHomeController } from './admin-home.controller';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileHomeService } from './admin-profile-home.service';

@Module({
  imports: [AdminApiSharedModule, ProfileHomeModule, PublicSiteModule],
  controllers: [AdminHomeController, AdminProfileController],
  providers: [AdminProfileHomeService],
  exports: [AdminProfileHomeService],
})
export class AdminProfileHomeModule {}
