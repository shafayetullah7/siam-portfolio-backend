import { Module } from '@nestjs/common';
import { PublicHealthModule } from './health/public-health.module';
import { PublicSiteModule } from './site/public-site.module';
import { PublicPublicationsModule } from './publications/public-publications.module';
import { PublicResearchModule } from './research/public-research.module';
import { PublicSitePagesModule } from './site-pages/public-site-pages.module';

@Module({
  imports: [
    PublicHealthModule,
    PublicResearchModule,
    PublicPublicationsModule,
    PublicSitePagesModule,
    PublicSiteModule,
  ],
})
export class PublicApiModule {}
