import { Injectable } from '@nestjs/common';
import { DashboardService } from '../../domain/dashboard/dashboard.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dashboard: DashboardService) {}

  getCounts() {
    return this.dashboard.getCounts();
  }
}
