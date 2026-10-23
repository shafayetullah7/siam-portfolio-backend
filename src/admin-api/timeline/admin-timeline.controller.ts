import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminTimelineService } from './admin-timeline.service';
import {
  createTimelineEntryBodySchema,
  type CreateTimelineEntryBody,
} from './dto/create-timeline-entry.dto';
import {
  listTimelineQuerySchema,
  type ListTimelineQuery,
} from './dto/list-timeline-query.dto';
import { timelineEntryIdParamSchema } from './dto/timeline-entry-id-params.dto';
import {
  updateTimelineEntryBodySchema,
  type UpdateTimelineEntryBody,
} from './dto/update-timeline-entry.dto';

@ApiTags('admin-timeline')
@Controller('admin/timeline')
@UseGuards(AdminAuthGuard)
export class AdminTimelineController {
  constructor(private readonly timeline: AdminTimelineService) {}

  @Get()
  @ApiOperation({ summary: 'List timeline entries (admin; search and filters)' })
  async list(
    @Query({ schema: listTimelineQuerySchema }) query: ListTimelineQuery,
  ) {
    return await this.timeline.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create timeline entry draft' })
  async create(
    @Body({ schema: createTimelineEntryBodySchema }) body: CreateTimelineEntryBody,
  ) {
    return await this.timeline.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get timeline entry by id' })
  async get(@Param('id', { schema: timelineEntryIdParamSchema }) id: string) {
    return await this.timeline.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update timeline entry' })
  async update(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
    @Body({ schema: updateTimelineEntryBodySchema }) body: UpdateTimelineEntryBody,
  ) {
    return await this.timeline.update(id, body);
  }
}
