import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { ProfileHomeService } from './profile-home.service';

@Module({
  imports: [MediaModule],
  providers: [ProfileHomeService],
  exports: [ProfileHomeService],
})
export class ProfileHomeModule {}
