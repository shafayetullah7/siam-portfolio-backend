import { Module } from '@nestjs/common';
import { SitePagesModule } from '../site-pages/site-pages.module';
import { SiteService } from './site.service';

@Module({
  imports: [SitePagesModule],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
