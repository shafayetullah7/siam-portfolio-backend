import { Module } from '@nestjs/common';
import { RevisionsModule } from '../revisions/revisions.module';
import { SitePagesService } from './site-pages.service';

@Module({
  imports: [RevisionsModule],
  providers: [SitePagesService],
  exports: [SitePagesService],
})
export class SitePagesModule {}
