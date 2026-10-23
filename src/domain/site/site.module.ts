import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { PublicationsModule } from '../publications/publications.module';
import { ResearchModule } from '../research/research.module';
import { SitePagesModule } from '../site-pages/site-pages.module';
import { SiteService } from './site.service';

@Module({
  imports: [SitePagesModule, ResearchModule, PublicationsModule, ProjectsModule],
  providers: [SiteService],
  exports: [SiteService],
})
export class SiteModule {}
