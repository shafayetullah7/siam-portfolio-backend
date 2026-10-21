import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { sitePageSlugParamSchema } from './dto/site-page-slug-params.dto';
import { PublicSitePagesService } from './public-site-pages.service';

@ApiTags('public-pages')
@Controller('public/pages')
export class PublicSitePagesController {
  constructor(private readonly sitePages: PublicSitePagesService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get published site page by slug' })
  @ApiOkResponse({ description: 'Published page' })
  async getBySlug(
    @Param('slug', { schema: sitePageSlugParamSchema }) slug: string,
  ) {
    return await this.sitePages.getBySlug(slug);
  }
}
