import { Module } from '@nestjs/common';
import { PublicHealthModule } from './health/public-health.module';
import { PublicSiteModule } from './site/public-site.module';
import { PublicSitePagesModule } from './site-pages/public-site-pages.module';

@Module({
  imports: [PublicHealthModule, PublicSitePagesModule, PublicSiteModule],
})
export class PublicApiModule {}
