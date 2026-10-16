import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '../../common/http/api-response';
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
import { sitePageAdminResponseSchema } from './dto/site-page-admin-response.dto';
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
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  async list() {
    return apiSuccess(await this.sitePages.list());
  }

  @Post()
  @ApiOperation({ summary: 'Create site page draft' })
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async create(@Body({ schema: createSitePageBodySchema }) body: CreateSitePageBody) {
    return apiSuccess(await this.sitePages.create(body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site page by id' })
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async get(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.get(id));
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview draft page (admin)' })
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async preview(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.preview(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update site page' })
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async update(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Body({ schema: updateSitePageBodySchema }) body: UpdateSitePageBody,
  ) {
    return apiSuccess(await this.sitePages.update(id, body));
  }

  @Post(':id/publish')
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async publish(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.publish(id));
  }

  @Post(':id/unpublish')
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async unpublish(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.unpublish(id));
  }

  @Post(':id/archive')
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async archive(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.archive(id));
  }

  @Post(':id/schedule')
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async schedule(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Body({ schema: scheduleSitePageBodySchema }) body: ScheduleSitePageBody,
  ) {
    const row = await this.sitePages.schedule(id, new Date(body.scheduledAt));
    return apiSuccess(row);
  }

  @Get(':id/revisions')
  async revisions(@Param('id', { schema: sitePageIdParamSchema }) id: string) {
    return apiSuccess(await this.sitePages.listRevisions(id));
  }

  @Post(':id/revisions/:revisionId/restore')
  @SerializeOptions({ schema: sitePageAdminResponseSchema })
  async restore(
    @Param('id', { schema: sitePageIdParamSchema }) id: string,
    @Param('revisionId', { schema: sitePageIdParamSchema }) revisionId: string,
  ) {
    return apiSuccess(await this.sitePages.restore(id, revisionId));
  }
}
