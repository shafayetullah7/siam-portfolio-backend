import { Module } from '@nestjs/common';
import { ProfileHomeModule } from '../../domain/profile-home/profile-home.module';
import { SiteModule } from '../../domain/site/site.module';
import { PublicResearchModule } from '../research/public-research.module';
import { PublicSiteController } from './public-site.controller';
import { PublicSiteService } from './public-site.service';

@Module({
  imports: [SiteModule, ProfileHomeModule, PublicResearchModule],
  controllers: [PublicSiteController],
  providers: [PublicSiteService],
})
export class PublicSiteModule {}
