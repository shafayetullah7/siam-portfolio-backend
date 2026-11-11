import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { SiteModule } from '../../domain/site/site.module';
import { TalksModule } from '../../domain/talks/talks.module';
import { PublicCollaborationsPageController } from './public-collaborations-page.controller';
import { PublicCollaborationsPageService } from './public-collaborations-page.service';

@Module({
  imports: [TalksModule, MediaModule, SiteModule],
  controllers: [PublicCollaborationsPageController],
  providers: [PublicCollaborationsPageService],
  exports: [PublicCollaborationsPageService],
})
export class PublicCollaborationsPageModule {}
