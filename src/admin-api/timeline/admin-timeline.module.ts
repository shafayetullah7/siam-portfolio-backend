import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { TimelineModule } from '../../domain/timeline/timeline.module';
import { PublicTimelineModule } from '../../public-api/timeline/public-timeline.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminTimelineController } from './admin-timeline.controller';
import { AdminTimelineService } from './admin-timeline.service';

@Module({
  imports: [
    AdminApiSharedModule,
    TimelineModule,
    MediaModule,
    PublicTimelineModule,
  ],
  controllers: [AdminTimelineController],
  providers: [AdminTimelineService],
})
export class AdminTimelineModule {}
