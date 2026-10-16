import { Module } from '@nestjs/common';
import { RevisionsService } from './revisions.service';

@Module({
  providers: [RevisionsService],
  exports: [RevisionsService],
})
export class RevisionsModule {}
