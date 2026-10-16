import { Module } from '@nestjs/common';
import { SitePagesModule } from '../domain/site-pages/site-pages.module';
import { PublishSchedulerService } from './publish-scheduler.service';

@Module({
  imports: [SitePagesModule],
  providers: [PublishSchedulerService],
})
export class SchedulingModule {}
