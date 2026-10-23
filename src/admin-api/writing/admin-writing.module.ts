import { Module } from '@nestjs/common';
import { WritingModule } from '../../domain/writing/writing.module';
import { PublicWritingModule } from '../../public-api/writing/public-writing.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminWritingController } from './admin-writing.controller';
import { AdminWritingService } from './admin-writing.service';

@Module({
  imports: [AdminApiSharedModule, WritingModule, PublicWritingModule],
  controllers: [AdminWritingController],
  providers: [AdminWritingService],
})
export class AdminWritingModule {}
