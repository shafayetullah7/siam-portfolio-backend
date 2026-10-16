import { Module } from '@nestjs/common';
import { ProfileHomeService } from './profile-home.service';

@Module({
  providers: [ProfileHomeService],
  exports: [ProfileHomeService],
})
export class ProfileHomeModule {}
