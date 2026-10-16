import {
  Controller,
  Get,
  Param,
  SerializeOptions,
  StandardSchemaSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '../../common/http/api-response';
import { sitePagePublicResponseSchema } from './dto/site-page-public-response.dto';
import { sitePageSlugParamSchema } from './dto/site-page-slug-params.dto';
import { PublicSitePagesService } from './public-site-pages.service';

@ApiTags('public-pages')
@Controller('public/pages')
export class PublicSitePagesController {
  constructor(private readonly sitePages: PublicSitePagesService) {}

  @Get(':slug')
  @ApiOperation({ summary: 'Get published site page by slug' })
  @ApiOkResponse({ description: 'Published page' })
  @UseInterceptors(StandardSchemaSerializerInterceptor)
  @SerializeOptions({ schema: sitePagePublicResponseSchema })
  async getBySlug(
    @Param('slug', { schema: sitePageSlugParamSchema }) slug: string,
  ) {
    return apiSuccess(await this.sitePages.getBySlug(slug));
  }
}
