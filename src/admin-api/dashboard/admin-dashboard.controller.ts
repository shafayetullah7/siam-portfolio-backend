import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '../../common/http/api-response';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
@UseGuards(AdminAuthGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get()
  async get() {
    return apiSuccess(await this.dashboard.getCounts());
  }
}
