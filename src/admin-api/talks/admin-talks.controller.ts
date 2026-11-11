import {
  Body,
  Controller,
  Delete,
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
import { AdminTalksService } from './admin-talks.service';
import {
  createTalkBodySchema,
  type CreateTalkBody,
} from './dto/create-talk.dto';
import {
  listTalksQuerySchema,
  type ListTalksQuery,
} from './dto/list-talks-query.dto';
import {
  putTalkRelationsBodySchema,
  type PutTalkRelationsBody,
} from './dto/put-talk-relations.dto';
import {
  putTalkResourcesBodySchema,
  type PutTalkResourcesBody,
} from './dto/put-talk-resources.dto';
import {
  publishTalkBodySchema,
  type PublishTalkBody,
} from './dto/publish-talk.dto';
import {
  scheduleTalkBodySchema,
  type ScheduleTalkBody,
} from './dto/schedule-talk.dto';
import { talkIdParamSchema } from './dto/talk-id-params.dto';
import {
  updateTalkBodySchema,
  type UpdateTalkBody,
} from './dto/update-talk.dto';

@ApiTags('admin-talks')
@Controller('admin/talks')
@UseGuards(AdminAuthGuard)
export class AdminTalksController {
  constructor(private readonly talks: AdminTalksService) {}

  @Get()
  @ApiOperation({ summary: 'List talks (admin; search and filters)' })
  async list(@Query({ schema: listTalksQuerySchema }) query: ListTalksQuery) {
    return await this.talks.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create talk draft' })
  async create(
    @Body({ schema: createTalkBodySchema }) body: CreateTalkBody,
  ) {
    return await this.talks.create(body);
  }

  @Put(':id/resources')
  @ApiOperation({ summary: 'Replace talk resources' })
  async putResources(
    @Param('id', { schema: talkIdParamSchema }) id: string,
    @Body({ schema: putTalkResourcesBodySchema }) body: PutTalkResourcesBody,
  ) {
    return await this.talks.putResources(id, body);
  }

  @Put(':id/relations')
  @ApiOperation({ summary: 'Replace talk relations' })
  async putRelations(
    @Param('id', { schema: talkIdParamSchema }) id: string,
    @Body({ schema: putTalkRelationsBodySchema }) body: PutTalkRelationsBody,
  ) {
    return await this.talks.putRelations(id, body);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(@Param('id', { schema: talkIdParamSchema }) id: string) {
    return await this.talks.publishCheck(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get talk by id' })
  async get(@Param('id', { schema: talkIdParamSchema }) id: string) {
    return await this.talks.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update talk metadata' })
  async update(
    @Param('id', { schema: talkIdParamSchema }) id: string,
    @Body({ schema: updateTalkBodySchema }) body: UpdateTalkBody,
  ) {
    return await this.talks.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete talk' })
  async delete(@Param('id', { schema: talkIdParamSchema }) id: string) {
    await this.talks.delete(id);
    return null;
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish talk' })
  async publish(
    @Param('id', { schema: talkIdParamSchema }) id: string,
    @Body({ schema: publishTalkBodySchema }) body: PublishTalkBody,
  ) {
    return await this.talks.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish talk' })
  async unpublish(@Param('id', { schema: talkIdParamSchema }) id: string) {
    return await this.talks.unpublish(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule talk publish' })
  async schedule(
    @Param('id', { schema: talkIdParamSchema }) id: string,
    @Body({ schema: scheduleTalkBodySchema }) body: ScheduleTalkBody,
  ) {
    return await this.talks.schedule(id, body);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive talk' })
  async archive(@Param('id', { schema: talkIdParamSchema }) id: string) {
    return await this.talks.archive(id);
  }
}
