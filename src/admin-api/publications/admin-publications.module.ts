import { Module } from '@nestjs/common';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminPublicationsController } from './admin-publications.controller';
import { AdminPublicationsService } from './admin-publications.service';

@Module({
  imports: [AdminApiSharedModule, PublicationsModule],
  controllers: [AdminPublicationsController],
  providers: [AdminPublicationsService],
})
export class AdminPublicationsModule {}
