import { Module } from '@nestjs/common';
import { TalksModule } from '../../domain/talks/talks.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminAcademicServiceController } from './admin-academic-service.controller';
import { AdminAcademicServiceService } from './admin-academic-service.service';

@Module({
  imports: [AdminApiSharedModule, TalksModule],
  controllers: [AdminAcademicServiceController],
  providers: [AdminAcademicServiceService],
})
export class AdminAcademicServiceModule {}
