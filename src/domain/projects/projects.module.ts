import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { PublicationsModule } from '../publications/publications.module';
import { ProjectsService } from './projects.service';

@Module({
  imports: [MediaModule, PublicationsModule],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
