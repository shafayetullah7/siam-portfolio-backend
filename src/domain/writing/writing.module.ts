import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { WritingService } from './writing.service';

@Module({
  imports: [MediaModule],
  providers: [WritingService],
  exports: [WritingService],
})
export class WritingModule {}
