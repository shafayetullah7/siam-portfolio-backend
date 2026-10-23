import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { TimelineService } from './timeline.service';

@Module({
  imports: [MediaModule],
  providers: [TimelineService],
  exports: [TimelineService],
})
export class TimelineModule {}
