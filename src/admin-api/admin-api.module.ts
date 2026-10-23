import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminSiteModule } from './site/admin-site.module';
import { AdminProjectsModule } from './projects/admin-projects.module';
import { AdminTimelineModule } from './timeline/admin-timeline.module';
import { AdminWritingModule } from './writing/admin-writing.module';
import { AdminPublicationsModule } from './publications/admin-publications.module';
import { AdminResearchModule } from './research/admin-research.module';
import { AdminSitePagesModule } from './site-pages/admin-site-pages.module';
import { AdminMessagesModule } from './messages/admin-messages.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminResearchModule,
    AdminPublicationsModule,
    AdminProjectsModule,
    AdminWritingModule,
    AdminTimelineModule,
    AdminSitePagesModule,
    AdminSiteModule,
    AdminDashboardModule,
    AdminMediaModule,
    AdminMessagesModule,
  ],
})
export class AdminApiModule {}
