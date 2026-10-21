import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminSitePagesService } from './admin-site-pages.service';
import {
  createSitePageBodySchema,
  type CreateSitePageBody,
} from './dto/create-site-page.dto';
import {
  scheduleSitePageBodySchema,
  type ScheduleSitePageBody,
} from './dto/schedule-site-page.dto';
import { sitePageIdParamSchema } from './dto/site-page-id-params.dto';
import {
  updateSitePageBodySchema,
  type UpdateSitePageBody,
} from './dto/update-site-page.dto';

@ApiTags('admin-pages')
@Controller('admin/pages')
@UseGuards(AdminAuthGuard)
export class AdminSitePagesController {
  constructor(private readonly sitePages: AdminSitePagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all site pages' })
  async list() {
    return await this.sitePages.list();
  }

  @Post()
  @ApiOperation({ summary: 'Create site page draft' })
  async create(@Body({ schema: createSitePageBodySchema }) body: CreateSitePageBody) {
    return await this.sitePages.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site page by id' })
  async get(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.get(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview draft page (admin)' })
  async preview(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.preview(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update site page' })
  async update(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Body({ schema: updateSitePageBodySchema }) body: UpdateSitePageBody,
  ) {
    return await this.sitePages.update(id, body);
  }

  @Post(':id/publish')
  async publish(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.publish(id);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.unpublish(id);
  }

  @Post(':id/archive')
  async archive(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.archive(id);
  }

  @Post(':id/schedule')
  async schedule(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Body({ schema: scheduleSitePageBodySchema }) body: ScheduleSitePageBody,
  ) {
    return await this.sitePages.schedule(id, new Date(body.scheduledAt));
  }

  @Get(':id/revisions')
  async revisions(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return await this.sitePages.listRevisions(id);
  }

  @Post(':id/revisions/:revisionId/restore')
  async restore(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Param('revisionId', { schema: sitePageIdParamSchema }) revisionId: string,
  ) {
    return await this.sitePages.restore(id, revisionId);
  }
}
