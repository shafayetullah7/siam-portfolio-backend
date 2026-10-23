import { Module } from '@nestjs/common';
import { TimelineModule } from '../../domain/timeline/timeline.module';
import { PublicTimelineController } from './public-timeline.controller';
import { PublicTimelineService } from './public-timeline.service';

@Module({
  imports: [TimelineModule],
  controllers: [PublicTimelineController],
  providers: [PublicTimelineService],
  exports: [PublicTimelineService],
})
export class PublicTimelineModule {}
