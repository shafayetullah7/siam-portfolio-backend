import { Module } from '@nestjs/common';
import { ProjectsModule } from '../domain/projects/projects.module';
import { WritingModule } from '../domain/writing/writing.module';
import { PublicationsModule } from '../domain/publications/publications.module';
import { ResearchModule } from '../domain/research/research.module';
import { SitePagesModule } from '../domain/site-pages/site-pages.module';
import { PublishSchedulerService } from './publish-scheduler.service';

@Module({
  imports: [
    SitePagesModule,
    ResearchModule,
    PublicationsModule,
    ProjectsModule,
    WritingModule,
  ],
  providers: [PublishSchedulerService],
})
export class SchedulingModule {}
