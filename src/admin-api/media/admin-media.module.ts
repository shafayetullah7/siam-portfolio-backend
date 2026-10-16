import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';

@Module({
  imports: [AdminApiSharedModule, MediaModule],
  controllers: [AdminMediaController],
  providers: [AdminMediaService],
})
export class AdminMediaModule {}
