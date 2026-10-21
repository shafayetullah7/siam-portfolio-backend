import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { researchThemeSlugParamSchema } from './dto/research-theme-slug-params.dto';
import { PublicResearchService } from './public-research.service';

@ApiTags('public-research')
@Controller('public/research-themes')
export class PublicResearchController {
  constructor(private readonly research: PublicResearchService) {}

  @Get()
  @ApiOperation({ summary: 'List published research themes' })
  @ApiOkResponse({ description: 'Published theme cards' })
  async list() {
    return await this.research.listHub();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published research theme by slug' })
  @ApiOkResponse({ description: 'Published theme detail' })
  async getBySlug(
    @Param('slug', { schema: researchThemeSlugParamSchema }) slug: string,
  ) {
    return await this.research.getBySlug(slug);
  }
}
