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
import { AdminProjectsService } from './admin-projects.service';
import {
  createProjectBodySchema,
  type CreateProjectBody,
} from './dto/create-project.dto';
import {
  listProjectsQuerySchema,
  type ListProjectsQuery,
} from './dto/list-projects-query.dto';
import { projectIdParamSchema } from './dto/project-id-params.dto';
import {
  publishProjectBodySchema,
  type PublishProjectBody,
} from './dto/publish-project.dto';
import {
  scheduleProjectBodySchema,
  type ScheduleProjectBody,
} from './dto/schedule-project.dto';
import {
  updateProjectBodySchema,
  type UpdateProjectBody,
} from './dto/update-project.dto';
import {
  putProjectPublicationsBodySchema,
  type PutProjectPublicationsBody,
} from './dto/put-project-publications.dto';

@ApiTags('admin-projects')
@Controller('admin/projects')
@UseGuards(AdminAuthGuard)
export class AdminProjectsController {
  constructor(private readonly projects: AdminProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects (admin; search for pickers)' })
  async list(
    @Query({ schema: listProjectsQuerySchema }) query: ListProjectsQuery,
  ) {
    return await this.projects.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create project draft' })
  async create(
    @Body({ schema: createProjectBodySchema }) body: CreateProjectBody,
  ) {
    return await this.projects.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  async get(@Param('id', { schema: projectIdParamSchema }) id: string) {
    return await this.projects.get(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Public detail preview (any status)' })
  async preview(@Param('id', { schema: projectIdParamSchema }) id: string) {
    return await this.projects.preview(id);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: projectIdParamSchema }) id: string,
  ) {
    return await this.projects.getPublishCheck(id);
  }

  @Get(':id/publications')
  @ApiOperation({ summary: 'List publications linked to project' })
  async getPublications(
    @Param('id', { schema: projectIdParamSchema }) id: string,
  ) {
    return await this.projects.getPublications(id);
  }

  @Put(':id/publications')
  @ApiOperation({ summary: 'Replace publications linked to project' })
  async putPublications(
    @Param('id', { schema: projectIdParamSchema }) id: string,
    @Body({ schema: putProjectPublicationsBodySchema })
    body: PutProjectPublicationsBody,
  ) {
    return await this.projects.putPublications(id, body.publicationIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project draft' })
  async update(
    @Param('id', { schema: projectIdParamSchema }) id: string,
    @Body({ schema: updateProjectBodySchema }) body: UpdateProjectBody,
  ) {
    return await this.projects.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish project' })
  async publish(
    @Param('id', { schema: projectIdParamSchema }) id: string,
    @Body({ schema: publishProjectBodySchema }) body: PublishProjectBody,
  ) {
    return await this.projects.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish project' })
  async unpublish(
    @Param('id', { schema: projectIdParamSchema }) id: string,
  ) {
    return await this.projects.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive project' })
  async archive(@Param('id', { schema: projectIdParamSchema }) id: string) {
    return await this.projects.archive(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule project' })
  async schedule(
    @Param('id', { schema: projectIdParamSchema }) id: string,
    @Body({ schema: scheduleProjectBodySchema }) body: ScheduleProjectBody,
  ) {
    return await this.projects.schedule(id, new Date(body.scheduledAt));
  }
}
