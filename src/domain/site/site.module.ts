import { Module } from '@nestjs/common';
import { ResearchModule } from '../research/research.module';
import { SitePagesModule } from '../site-pages/site-pages.module';
import { SiteService } from './site.service';

@Module({
  imports: [SitePagesModule, ResearchModule],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
