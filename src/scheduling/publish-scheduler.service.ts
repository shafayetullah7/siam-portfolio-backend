import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResearchService } from '../domain/research/research.service';
import { SitePagesService } from '../domain/site-pages/site-pages.service';

@Injectable()
export class PublishSchedulerService {
  private readonly logger = new Logger(PublishSchedulerService.name);

  constructor(
    private readonly sitePages: SitePagesService,
    private readonly research: ResearchService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPages() {
    const pageCount = await this.sitePages.publishDueScheduled();
    if (pageCount > 0) {
      this.logger.log(`Published ${pageCount} scheduled site page(s)`);
    }
    const themeCount = await this.research.publishDueScheduled();
    if (themeCount > 0) {
      this.logger.log(`Published ${themeCount} scheduled research theme(s)`);
    }
  }
}
