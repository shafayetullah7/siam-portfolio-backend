import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProjectsService } from '../domain/projects/projects.service';
import { PublicationsService } from '../domain/publications/publications.service';
import { ResearchService } from '../domain/research/research.service';
import { SitePagesService } from '../domain/site-pages/site-pages.service';

@Injectable()
export class PublishSchedulerService {
  private readonly logger = new Logger(PublishSchedulerService.name);

  constructor(
    private readonly sitePages: SitePagesService,
    private readonly research: ResearchService,
    private readonly publications: PublicationsService,
    private readonly projects: ProjectsService,
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
    const publicationCount = await this.publications.publishDueScheduled();
    if (publicationCount > 0) {
      this.logger.log(`Published ${publicationCount} scheduled publication(s)`);
    }
    const projectCount = await this.projects.publishDueScheduled();
    if (projectCount > 0) {
      this.logger.log(`Published ${projectCount} scheduled project(s)`);
    }
  }
}
