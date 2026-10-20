import { Module } from '@nestjs/common';
import { CloudinaryModule } from '../../libs/cloudinary/cloudinary.module';
import { MediaService } from './media.service';

@Module({
  imports: [CloudinaryModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
