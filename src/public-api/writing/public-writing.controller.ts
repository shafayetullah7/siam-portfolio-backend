import {
  Controller,
  Get,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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

  @Get('feed.xml')
  @ApiOperation({ summary: 'RSS 2.0 feed of published articles' })
  async feed(@Res() res: Response) {
    const { xml, etag } = await this.writing.buildRssFeed();
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.set('ETag', etag);
    res.send(xml);
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
