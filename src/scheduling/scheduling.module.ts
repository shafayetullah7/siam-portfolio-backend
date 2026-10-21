import { Module } from '@nestjs/common';
import { ResearchModule } from '../domain/research/research.module';
import { SitePagesModule } from '../domain/site-pages/site-pages.module';
import { PublishSchedulerService } from './publish-scheduler.service';

@Module({
  imports: [SitePagesModule, ResearchModule],
  providers: [PublishSchedulerService],
})
export class SchedulingModule {}
