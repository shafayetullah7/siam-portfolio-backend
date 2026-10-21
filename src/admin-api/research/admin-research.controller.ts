import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminResearchService } from './admin-research.service';
import {
  createResearchThemeBodySchema,
  type CreateResearchThemeBody,
} from './dto/create-research-theme.dto';
import {
  listResearchQuerySchema,
  type ListResearchQuery,
} from './dto/list-research-query.dto';
import { researchThemeIdParamSchema } from './dto/research-theme-id-params.dto';
import {
  scheduleResearchThemeBodySchema,
  type ScheduleResearchThemeBody,
} from './dto/schedule-research-theme.dto';
import {
  publishResearchThemeBodySchema,
  type PublishResearchThemeBody,
} from './dto/publish-research-theme.dto';
import {
  putResearchThemePublicationsBodySchema,
  type PutResearchThemePublicationsBody,
} from './dto/research-theme-publication-link.dto';
import {
  putResearchThemeProjectsBodySchema,
  type PutResearchThemeProjectsBody,
} from './dto/research-theme-project-link.dto';
import {
  updateResearchThemeBodySchema,
  type UpdateResearchThemeBody,
} from './dto/update-research-theme.dto';

@ApiTags('admin-research')
@Controller('admin/research')
@UseGuards(AdminAuthGuard)
export class AdminResearchController {
  constructor(private readonly research: AdminResearchService) {}

  @Get()
  @ApiOperation({ summary: 'List research themes (admin; all statuses)' })
  async list(@Query({ schema: listResearchQuerySchema }) query: ListResearchQuery) {
    return await this.research.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create research theme draft' })
  async create(
    @Body({ schema: createResearchThemeBodySchema }) body: CreateResearchThemeBody,
  ) {
    return await this.research.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get research theme by id' })
  async get(@Param('id', { schema: researchThemeIdParamSchema }) id: string) {
    return await this.research.get(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview research theme (public detail shape)' })
  async preview(@Param('id', { schema: researchThemeIdParamSchema }) id: string) {
    return await this.research.preview(id);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
  ) {
    return await this.research.getPublishCheck(id);
  }

  @Get(':id/publications')
  @ApiOperation({ summary: 'List publications linked to research theme' })
  async getPublications(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
  ) {
    return await this.research.getPublications(id);
  }

  @Put(':id/publications')
  @ApiOperation({ summary: 'Replace publications linked to research theme' })
  async putPublications(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Body({ schema: putResearchThemePublicationsBodySchema })
    body: PutResearchThemePublicationsBody,
  ) {
    return await this.research.putPublications(id, body.publicationIds);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'List projects linked to research theme' })
  async getProjects(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
  ) {
    return await this.research.getProjects(id);
  }

  @Put(':id/projects')
  @ApiOperation({ summary: 'Replace projects linked to research theme' })
  async putProjects(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Body({ schema: putResearchThemeProjectsBodySchema })
    body: PutResearchThemeProjectsBody,
  ) {
    return await this.research.putProjects(id, body.projectIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update research theme' })
  async update(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Body({ schema: updateResearchThemeBodySchema }) body: UpdateResearchThemeBody,
  ) {
    return await this.research.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish research theme' })
  async publish(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Body({ schema: publishResearchThemeBodySchema }) body: PublishResearchThemeBody,
  ) {
    return await this.research.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish research theme' })
  async unpublish(@Param('id', { schema: researchThemeIdParamSchema }) id: string) {
    return await this.research.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive research theme' })
  async archive(@Param('id', { schema: researchThemeIdParamSchema }) id: string) {
    return await this.research.archive(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule research theme' })
  async schedule(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Body({ schema: scheduleResearchThemeBodySchema }) body: ScheduleResearchThemeBody,
  ) {
    return await this.research.schedule(id, new Date(body.scheduledAt));
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'List research theme revisions' })
  async revisions(@Param('id', { schema: researchThemeIdParamSchema }) id: string) {
    return await this.research.listRevisions(id);
  }

  @Post(':id/revisions/:revisionId/restore')
  @ApiOperation({ summary: 'Restore research theme from revision' })
  async restore(
    @Param('id', { schema: researchThemeIdParamSchema }) id: string,
    @Param('revisionId', { schema: researchThemeIdParamSchema }) revisionId: string,
  ) {
    return await this.research.restore(id, revisionId);
  }
}
