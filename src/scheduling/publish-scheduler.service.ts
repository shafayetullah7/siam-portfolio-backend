import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SitePagesService } from '../domain/site-pages/site-pages.service';

@Injectable()
export class PublishSchedulerService {
  private readonly logger = new Logger(PublishSchedulerService.name);

  constructor(private readonly sitePages: SitePagesService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPages() {
    const count = await this.sitePages.publishDueScheduled();
    if (count > 0) {
      this.logger.log(`Published ${count} scheduled site page(s)`);
    }
  }
}
