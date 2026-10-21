import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminProjectsService } from './admin-projects.service';
import {
  listProjectsQuerySchema,
  type ListProjectsQuery,
} from './dto/list-projects-query.dto';
import { projectIdParamSchema } from './dto/project-id-params.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get project by id' })
  async get(@Param('id', { schema: projectIdParamSchema }) id: string) {
    return await this.projects.get(id);
  }
}
