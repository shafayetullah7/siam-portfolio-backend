import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { PublicationsModule } from '../publications/publications.module';
import { RevisionsModule } from '../revisions/revisions.module';
import { ResearchService } from './research.service';

@Module({
  imports: [RevisionsModule, MediaModule, PublicationsModule, ProjectsModule],
  providers: [ResearchService],
  exports: [ResearchService],
})
export class ResearchModule {}
