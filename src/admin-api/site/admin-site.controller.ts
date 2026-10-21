import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminSiteService } from './admin-site.service';
import {
  updateSiteSettingsBodySchema,
  type UpdateSiteSettingsBody,
} from './dto/update-site-settings.dto';

@ApiTags('admin-site')
@Controller('admin/site')
@UseGuards(AdminAuthGuard)
export class AdminSiteController {
  constructor(private readonly adminSite: AdminSiteService) {}

  @Get('settings')
  async getSettings() {
    return await this.adminSite.getSettings();
  }

  @Patch('settings')
  async patchSettings(
    @Body({ schema: updateSiteSettingsBodySchema }) body: UpdateSiteSettingsBody,
  ) {
    return await this.adminSite.updateSettings(body);
  }

  @Get('nav')
  async listNav() {
    return await this.adminSite.listNav();
  }

  @Post('nav')
  async upsertNav(@Body() body: Record<string, unknown>) {
    return await this.adminSite.upsertNavItem(body);
  }

  @Patch('profile')
  async patchProfile(@Body() body: Record<string, unknown>) {
    return await this.adminSite.updateProfile(body);
  }

  @Patch('homepage')
  async patchHomepage(@Body() body: Record<string, unknown>) {
    return await this.adminSite.updateHomepage(body);
  }
}
