import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { TimelineModule } from '../timeline/timeline.module';
import { WritingModule } from '../writing/writing.module';
import { PublicationsModule } from '../publications/publications.module';
import { ResearchModule } from '../research/research.module';
import { SitePagesModule } from '../site-pages/site-pages.module';
import { SiteService } from './site.service';

@Module({
  imports: [
    SitePagesModule,
    ResearchModule,
    PublicationsModule,
    ProjectsModule,
    WritingModule,
    TimelineModule,
  ],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
