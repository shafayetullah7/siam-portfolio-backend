import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/app-config.module';
import { MediaModule } from '../../domain/media/media.module';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { ResearchModule } from '../../domain/research/research.module';
import { SiteModule } from '../../domain/site/site.module';
import { WritingModule } from '../../domain/writing/writing.module';
import { PublicWritingController } from './public-writing.controller';
import { PublicWritingService } from './public-writing.service';

@Module({
  imports: [
    WritingModule,
    PublicationsModule,
    ProjectsModule,
    ResearchModule,
    MediaModule,
    SiteModule,
    AppConfigModule,
  ],
  controllers: [PublicWritingController],
  providers: [PublicWritingService],
  exports: [PublicWritingService],
})
export class PublicWritingModule {}
