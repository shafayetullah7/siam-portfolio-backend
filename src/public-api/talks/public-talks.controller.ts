import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { talkSlugParamSchema } from './dto/talk-slug-params.dto';
import { PublicTalksService } from './public-talks.service';

@ApiTags('public-talks')
@Controller('public/talks')
export class PublicTalksController {
  constructor(private readonly talks: PublicTalksService) {}

  @Get()
  @ApiOperation({ summary: 'Talks hub (upcoming and past)' })
  @ApiOkResponse({ description: 'Published talk cards grouped by date' })
  async hub() {
    return await this.talks.hub();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published talk by slug' })
  @ApiOkResponse({ description: 'Talk detail with materials and related outputs' })
  async getBySlug(
    @Param('slug', { schema: talkSlugParamSchema }) slug: string,
  ) {
    return await this.talks.getBySlug(slug);
  }
}
