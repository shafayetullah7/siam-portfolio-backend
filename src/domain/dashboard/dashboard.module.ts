import { Module } from '@nestjs/common';
import { ContactModule } from '../contact/contact.module';
import { SiteModule } from '../site/site.module';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ContactModule, SiteModule],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
