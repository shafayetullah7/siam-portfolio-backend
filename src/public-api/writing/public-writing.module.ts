import { Module } from '@nestjs/common';
import { MediaModule } from '../../domain/media/media.module';
import { SiteModule } from '../../domain/site/site.module';
import { WritingModule } from '../../domain/writing/writing.module';
import { PublicWritingController } from './public-writing.controller';
import { PublicWritingService } from './public-writing.service';

@Module({
  imports: [WritingModule, MediaModule, SiteModule],
  controllers: [PublicWritingController],
  providers: [PublicWritingService],
  exports: [PublicWritingService],
})
export class PublicWritingModule {}
