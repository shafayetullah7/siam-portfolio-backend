import { Module } from '@nestjs/common';
import { SiteModule } from '../../domain/site/site.module';
import { TimelineModule } from '../../domain/timeline/timeline.module';
import { PublicTimelineController } from './public-timeline.controller';
import { PublicTimelineService } from './public-timeline.service';

@Module({
  imports: [TimelineModule, SiteModule],
  controllers: [PublicTimelineController],
  providers: [PublicTimelineService],
  exports: [PublicTimelineService],
})
export class PublicTimelineModule {}
