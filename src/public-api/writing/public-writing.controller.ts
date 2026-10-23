import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listPublicWritingQuerySchema,
  type ListPublicWritingQuery,
} from './dto/list-public-writing-query.dto';
import { writingSlugParamSchema } from './dto/writing-slug-params.dto';
import { PublicWritingService } from './public-writing.service';

@ApiTags('public-writing')
@Controller('public/writing')
export class PublicWritingController {
  constructor(private readonly writing: PublicWritingService) {}

  @Get()
  @ApiOperation({ summary: 'List published articles' })
  @ApiOkResponse({ description: 'Published article cards' })
  async list(
    @Query({ schema: listPublicWritingQuerySchema })
    query: ListPublicWritingQuery,
  ) {
    return await this.writing.list(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published article by slug' })
  @ApiOkResponse({ description: 'Published article detail' })
  async getBySlug(
    @Param('slug', { schema: writingSlugParamSchema }) slug: string,
  ) {
    return await this.writing.getBySlug(slug);
  }
}
