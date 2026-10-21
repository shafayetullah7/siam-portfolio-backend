import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { ResearchModule } from '../../domain/research/research.module';
import { SiteModule } from '../../domain/site/site.module';
import { PublicResearchController } from './public-research.controller';
import { PublicResearchService } from './public-research.service';

@Module({
  imports: [
    ResearchModule,
    PublicationsModule,
    ProjectsModule,
    MediaModule,
    SiteModule,
  ],
  controllers: [PublicResearchController],
  providers: [PublicResearchService],
  exports: [PublicResearchService],
})
export class PublicResearchModule {}
