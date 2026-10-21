import { Module } from '@nestjs/common';
import { ProjectsModule } from '../../domain/projects/projects.module';
import { PublicationsModule } from '../../domain/publications/publications.module';
import { ResearchModule } from '../../domain/research/research.module';
import { PublicResearchModule } from '../../public-api/research/public-research.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminResearchController } from './admin-research.controller';
import { AdminResearchService } from './admin-research.service';

@Module({
  imports: [
    AdminApiSharedModule,
    ResearchModule,
    PublicationsModule,
    ProjectsModule,
    PublicResearchModule,
  ],
  controllers: [AdminResearchController],
  providers: [AdminResearchService],
})
export class AdminResearchModule {}
