import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PublicationsImportService } from './publications-import.service';
import { PublicationsService } from './publications.service';

@Module({
  imports: [MediaModule],
  providers: [PublicationsService, PublicationsImportService],
  exports: [PublicationsService, PublicationsImportService],
})
export class PublicationsModule {}
