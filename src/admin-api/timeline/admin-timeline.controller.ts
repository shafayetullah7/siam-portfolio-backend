import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  publishTimelineEntryBodySchema,
  type PublishTimelineEntryBody,
} from './dto/publish-timeline-entry.dto';
import {
  replaceTimelineEntryMediaBodySchema,
  type ReplaceTimelineEntryMediaBody,
} from './dto/replace-timeline-entry-media.dto';
import {
  scheduleTimelineEntryBodySchema,
  type ScheduleTimelineEntryBody,
} from './dto/schedule-timeline-entry.dto';
import {
  reorderTimelineEntriesBodySchema,
  type ReorderTimelineEntriesBody,
} from './dto/reorder-timeline-entries.dto';
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

  @Post('reorder')
  @ApiOperation({ summary: 'Batch update sort order for timeline entries' })
  async reorder(
    @Body({ schema: reorderTimelineEntriesBodySchema })
    body: ReorderTimelineEntriesBody,
  ) {
    await this.timeline.reorder(body);
    return { ok: true };
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Public detail preview (any status)' })
  async preview(@Param('id', { schema: timelineEntryIdParamSchema }) id: string) {
    return await this.timeline.preview(id);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
  ) {
    return await this.timeline.getPublishCheck(id);
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

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish timeline entry' })
  async publish(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
    @Body({ schema: publishTimelineEntryBodySchema })
    body: PublishTimelineEntryBody,
  ) {
    return await this.timeline.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish timeline entry' })
  async unpublish(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
  ) {
    return await this.timeline.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive timeline entry' })
  async archive(@Param('id', { schema: timelineEntryIdParamSchema }) id: string) {
    return await this.timeline.archive(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule timeline entry' })
  async schedule(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
    @Body({ schema: scheduleTimelineEntryBodySchema })
    body: ScheduleTimelineEntryBody,
  ) {
    return await this.timeline.schedule(id, body);
  }

  @Put(':id/media')
  @ApiOperation({ summary: 'Replace ordered gallery images for a timeline entry' })
  async replaceMedia(
    @Param('id', { schema: timelineEntryIdParamSchema }) id: string,
    @Body({ schema: replaceTimelineEntryMediaBodySchema })
    body: ReplaceTimelineEntryMediaBody,
  ) {
    return await this.timeline.replaceMedia(id, body);
  }
}
