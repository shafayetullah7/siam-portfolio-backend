import { Module } from '@nestjs/common';
import { DashboardModule } from '../../domain/dashboard/dashboard.module';
import { AdminApiSharedModule } from '../admin-api-shared.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [AdminApiSharedModule, DashboardModule],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
