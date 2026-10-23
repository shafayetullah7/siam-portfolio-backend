import { Module } from '@nestjs/common';
import { WritingService } from './writing.service';

@Module({
  providers: [WritingService],
  exports: [WritingService],
})
export class WritingModule {}
