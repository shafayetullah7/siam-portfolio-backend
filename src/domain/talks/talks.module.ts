import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { AcademicServiceService } from './academic-service.service';
import { CollaborationsService } from './collaborations.service';
import { TalksService } from './talks.service';

@Module({
  imports: [MediaModule],
  providers: [TalksService, CollaborationsService, AcademicServiceService],
  exports: [TalksService, CollaborationsService, AcademicServiceService],
})
export class TalksModule {}
