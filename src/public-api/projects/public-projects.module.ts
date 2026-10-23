import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { ResearchModule } from '../../domain/research/research.module';
import { SiteModule } from '../../domain/site/site.module';
import { PublicProjectsController } from './public-projects.controller';
import { PublicProjectsService } from './public-projects.service';

@Module({
  imports: [
    ProjectsModule,
    MediaModule,
    SiteModule,
    PublicationsModule,
    ResearchModule,
  ],
  controllers: [PublicProjectsController],
  providers: [PublicProjectsService],
  exports: [PublicProjectsService],
})
export class PublicProjectsModule {}
