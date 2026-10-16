import { Module } from '@nestjs/common';
import { ProfileHomeModule } from '../../domain/profile-home/profile-home.module';
import { SiteModule } from '../../domain/site/site.module';
import { PublicSiteController } from './public-site.controller';
import { PublicSiteService } from './public-site.service';

@Module({
  imports: [SiteModule, ProfileHomeModule],
  controllers: [PublicSiteController],
  providers: [PublicSiteService],
})
export class PublicSiteModule {}
