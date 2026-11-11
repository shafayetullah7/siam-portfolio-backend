import { Module } from '@nestjs/common';
import { TalksModule } from '../../domain/talks/talks.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminCollaborationsController } from './admin-collaborations.controller';
import { AdminCollaborationsService } from './admin-collaborations.service';

@Module({
  imports: [AdminApiSharedModule, TalksModule],
  controllers: [AdminCollaborationsController],
  providers: [AdminCollaborationsService],
})
export class AdminCollaborationsModule {}
