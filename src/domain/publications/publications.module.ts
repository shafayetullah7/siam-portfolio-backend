import { Module } from '@nestjs/common';
import { PublicationsService } from './publications.service';

@Module({
  providers: [PublicationsService],
  exports: [PublicationsService],
})
export class PublicationsModule {}
