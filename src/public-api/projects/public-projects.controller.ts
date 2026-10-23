import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listPublicProjectsQuerySchema,
  type ListPublicProjectsQuery,
} from './dto/list-public-projects-query.dto';
import { projectSlugParamSchema } from './dto/project-slug-params.dto';
import { PublicProjectsService } from './public-projects.service';

@ApiTags('public-projects')
@Controller('public/projects')
export class PublicProjectsController {
  constructor(private readonly projects: PublicProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List published projects' })
  @ApiOkResponse({ description: 'Published project cards' })
  async list(
    @Query({ schema: listPublicProjectsQuerySchema })
    query: ListPublicProjectsQuery,
  ) {
    return await this.projects.list(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published project by slug' })
  @ApiOkResponse({ description: 'Published project detail' })
  async getBySlug(
    @Param('slug', { schema: projectSlugParamSchema }) slug: string,
  ) {
    return await this.projects.getBySlug(slug);
  }
}
