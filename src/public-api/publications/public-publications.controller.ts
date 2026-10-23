import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listPublicPublicationsQuerySchema,
  type ListPublicPublicationsQuery,
} from './dto/list-public-publications-query.dto';
import { publicationSlugParamSchema } from './dto/publication-slug-params.dto';
import { PublicPublicationsService } from './public-publications.service';

@ApiTags('public-publications')
@Controller('public/publications')
export class PublicPublicationsController {
  constructor(private readonly publications: PublicPublicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List published publications' })
  @ApiOkResponse({ description: 'Published publication cards' })
  async list(
    @Query({ schema: listPublicPublicationsQuerySchema })
    query: ListPublicPublicationsQuery,
  ) {
    return await this.publications.list(query);
  }

  @Get(':slug/bibtex')
  @ApiOperation({ summary: 'Citation and BibTeX for published publication' })
  @ApiOkResponse({ description: 'BibTeX and formatted citation' })
  async getBibtex(
    @Param('slug', { schema: publicationSlugParamSchema }) slug: string,
  ) {
    return await this.publications.getBibtex(slug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published publication by slug' })
  @ApiOkResponse({ description: 'Published publication detail' })
  async getBySlug(
    @Param('slug', { schema: publicationSlugParamSchema }) slug: string,
  ) {
    return await this.publications.getBySlug(slug);
  }
}
