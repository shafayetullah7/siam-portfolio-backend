import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminPublicationsService } from './admin-publications.service';
import {
  listPublicationsQuerySchema,
  type ListPublicationsQuery,
} from './dto/list-publications-query.dto';
import { publicationIdParamSchema } from './dto/publication-id-params.dto';

@ApiTags('admin-publications')
@Controller('admin/publications')
@UseGuards(AdminAuthGuard)
export class AdminPublicationsController {
  constructor(private readonly publications: AdminPublicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List publications (admin; search for pickers)' })
  async list(
    @Query({ schema: listPublicationsQuerySchema }) query: ListPublicationsQuery,
  ) {
    return await this.publications.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publication by id' })
  async get(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.get(id);
  }
}
