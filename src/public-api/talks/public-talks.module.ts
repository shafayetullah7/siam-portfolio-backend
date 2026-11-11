import { Module } from '@nestjs/common';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { ResearchModule } from '../../domain/research/research.module';
import { SiteModule } from '../../domain/site/site.module';
import { TalksModule } from '../../domain/talks/talks.module';
import { PublicTalksController } from './public-talks.controller';
import { PublicTalksService } from './public-talks.service';

@Module({
  imports: [
    TalksModule,
    SiteModule,
    PublicationsModule,
    ProjectsModule,
    ResearchModule,
  ],
  controllers: [PublicTalksController],
  providers: [PublicTalksService],
  exports: [PublicTalksService],
})
export class PublicTalksModule {}
