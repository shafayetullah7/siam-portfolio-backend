import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  listPublicTimelineQuerySchema,
  type ListPublicTimelineQuery,
} from './dto/list-public-timeline-query.dto';
import { timelineSlugParamSchema } from './dto/timeline-slug-params.dto';
import { PublicTimelineService } from './public-timeline.service';

@ApiTags('public-timeline')
@Controller('public/timeline')
export class PublicTimelineController {
  constructor(private readonly timeline: PublicTimelineService) {}

  @Get('achievements')
  @ApiOperation({ summary: 'List published achievements (P09) by kind section' })
  @ApiOkResponse({ description: 'Grouped achievement sections' })
  async listAchievements(
    @Query({ schema: listPublicTimelineQuerySchema }) query: ListPublicTimelineQuery,
  ) {
    return await this.timeline.listAchievements(query);
  }

  @Get('experience')
  @ApiOperation({ summary: 'List published education and experience (P10)' })
  @ApiOkResponse({ description: 'Grouped experience sections' })
  async listExperience(
    @Query({ schema: listPublicTimelineQuerySchema }) query: ListPublicTimelineQuery,
  ) {
    return await this.timeline.listExperience(query);
  }

  @Get()
  @ApiOperation({ summary: 'List published timeline entries (all kinds)' })
  @ApiOkResponse({ description: 'Paginated timeline cards' })
  async list(
    @Query({ schema: listPublicTimelineQuerySchema }) query: ListPublicTimelineQuery,
  ) {
    return await this.timeline.listAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get published timeline entry by slug' })
  @ApiOkResponse({ description: 'Timeline entry detail with gallery' })
  async getBySlug(
    @Param('slug', { schema: timelineSlugParamSchema }) slug: string,
  ) {
    return await this.timeline.getBySlug(slug);
  }
}
