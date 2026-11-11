import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminProfileHomeService } from './admin-profile-home.service';
import {
  publishSingletonBodySchema,
  type PublishSingletonBody,
} from './dto/publish-singleton.dto';
import {
  updateProfileBodySchema,
  type UpdateProfileBody,
} from './dto/update-profile.dto';

@ApiTags('admin-profile')
@Controller('admin/profile')
@UseGuards(AdminAuthGuard)
export class AdminProfileController {
  constructor(private readonly profileHome: AdminProfileHomeService) {}

  @Get()
  @ApiOperation({ summary: 'Profile / identity singleton (admin)' })
  async getProfile() {
    return await this.profileHome.getProfile();
  }

  @Patch()
  @ApiOperation({ summary: 'Partial update profile / identity (singleton)' })
  async patchProfile(
    @Body({ schema: updateProfileBodySchema }) body: UpdateProfileBody,
  ) {
    return await this.profileHome.updateProfile(body);
  }

  @Get('publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist for profile' })
  async publishCheck() {
    return await this.profileHome.getProfilePublishChecklist();
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish profile singleton' })
  async publish(
    @Body({ schema: publishSingletonBodySchema }) body: PublishSingletonBody,
  ) {
    return await this.profileHome.publishProfile(body);
  }

  @Post('unpublish')
  @ApiOperation({ summary: 'Unpublish profile singleton' })
  async unpublish() {
    return await this.profileHome.unpublishProfile();
  }
}
