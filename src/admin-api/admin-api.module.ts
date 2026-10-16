import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminMediaModule } from './media/admin-media.module';
import { AdminSiteModule } from './site/admin-site.module';
import { AdminSitePagesModule } from './site-pages/admin-site-pages.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminSitePagesModule,
    AdminSiteModule,
    AdminDashboardModule,
    AdminMediaModule,
  ],
})
export class AdminApiModule {}
