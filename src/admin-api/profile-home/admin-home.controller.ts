import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminProfileHomeService } from './admin-profile-home.service';
import {
  publishSingletonBodySchema,
  type PublishSingletonBody,
} from './dto/publish-singleton.dto';
import {
  updateHomepageBodySchema,
  type UpdateHomepageBody,
} from './dto/update-homepage.dto';

@ApiTags('admin-home')
@Controller('admin/home')
@UseGuards(AdminAuthGuard)
export class AdminHomeController {
  constructor(private readonly profileHome: AdminProfileHomeService) {}

  @Get()
  @ApiOperation({
    summary: 'Home editor aggregate (profile + homepage singleton rows)',
  })
  async getAggregate() {
    return await this.profileHome.getHomeAggregate();
  }

  @Patch()
  @ApiOperation({ summary: 'Partial update homepage composition (singleton)' })
  async patchHomepage(
    @Body({ schema: updateHomepageBodySchema }) body: UpdateHomepageBody,
  ) {
    return await this.profileHome.updateHomepage(body);
  }

  @Get('publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist for homepage' })
  async publishCheck() {
    return await this.profileHome.getHomepagePublishChecklist();
  }

  @Post('publish')
  @ApiOperation({ summary: 'Publish homepage singleton' })
  async publish(
    @Body({ schema: publishSingletonBodySchema }) body: PublishSingletonBody,
  ) {
    return await this.profileHome.publishHomepage(body);
  }

  @Post('unpublish')
  @ApiOperation({ summary: 'Unpublish homepage singleton' })
  async unpublish() {
    return await this.profileHome.unpublishHomepage();
  }

  @Get('preview')
  @ApiOperation({
    summary: 'Draft homepage preview (public home DTO, unpublished flag)',
  })
  async preview() {
    return await this.profileHome.getHomePreview();
  }

  @Get('featured-summary')
  @ApiOperation({
    summary: 'Featured-on-home picks across research, publications, and projects',
  })
  async featuredSummary() {
    return await this.profileHome.getFeaturedSummary();
  }
}
