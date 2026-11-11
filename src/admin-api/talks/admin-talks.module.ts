import { Module } from '@nestjs/common';
import { TalksModule } from '../../domain/talks/talks.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminTalksController } from './admin-talks.controller';
import { AdminTalksService } from './admin-talks.service';

@Module({
  imports: [AdminApiSharedModule, TalksModule],
  controllers: [AdminTalksController],
  providers: [AdminTalksService],
})
export class AdminTalksModule {}
