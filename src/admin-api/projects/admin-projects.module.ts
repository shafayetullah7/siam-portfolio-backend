import { Module } from '@nestjs/common';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { PublicProjectsModule } from '../../public-api/projects/public-projects.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminProjectsController } from './admin-projects.controller';
import { AdminProjectsService } from './admin-projects.service';

@Module({
  imports: [
    AdminApiSharedModule,
    ProjectsModule,
    PublicationsModule,
    PublicProjectsModule,
  ],
  controllers: [AdminProjectsController],
  providers: [AdminProjectsService],
})
export class AdminProjectsModule {}
