import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminCollaborationsService } from './admin-collaborations.service';
import {
  createCollaborationBodySchema,
  type CreateCollaborationBody,
} from './dto/create-collaboration.dto';
import { collaborationIdParamSchema } from './dto/collaboration-id-params.dto';
import {
  listCollaborationsQuerySchema,
  type ListCollaborationsQuery,
} from './dto/list-collaborations-query.dto';
import {
  publishTalkBodySchema,
  type PublishTalkBody,
} from '../talks/dto/publish-talk.dto';
import {
  scheduleTalkBodySchema,
  type ScheduleTalkBody,
} from '../talks/dto/schedule-talk.dto';
import {
  updateCollaborationBodySchema,
  type UpdateCollaborationBody,
} from './dto/update-collaboration.dto';

@ApiTags('admin-collaborations')
@Controller('admin/collaborations')
@UseGuards(AdminAuthGuard)
export class AdminCollaborationsController {
  constructor(private readonly collaborations: AdminCollaborationsService) {}

  @Get()
  @ApiOperation({ summary: 'List collaborations (admin)' })
  async list(
    @Query({ schema: listCollaborationsQuerySchema })
    query: ListCollaborationsQuery,
  ) {
    return await this.collaborations.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create collaboration draft' })
  async create(
    @Body({ schema: createCollaborationBodySchema }) body: CreateCollaborationBody,
  ) {
    return await this.collaborations.create(body);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: collaborationIdParamSchema }) id: string,
  ) {
    return await this.collaborations.publishCheck(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collaboration by id' })
  async get(@Param('id', { schema: collaborationIdParamSchema }) id: string) {
    return await this.collaborations.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collaboration' })
  async update(
    @Param('id', { schema: collaborationIdParamSchema }) id: string,
    @Body({ schema: updateCollaborationBodySchema }) body: UpdateCollaborationBody,
  ) {
    return await this.collaborations.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete collaboration' })
  async delete(@Param('id', { schema: collaborationIdParamSchema }) id: string) {
    await this.collaborations.delete(id);
    return null;
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish collaboration' })
  async publish(
    @Param('id', { schema: collaborationIdParamSchema }) id: string,
    @Body({ schema: publishTalkBodySchema }) body: PublishTalkBody,
  ) {
    return await this.collaborations.publish(id, body);
  }

  @Post(':id/unpublish')
  async unpublish(@Param('id', { schema: collaborationIdParamSchema }) id: string) {
    return await this.collaborations.unpublish(id);
  }

  @Post(':id/schedule')
  async schedule(
    @Param('id', { schema: collaborationIdParamSchema }) id: string,
    @Body({ schema: scheduleTalkBodySchema }) body: ScheduleTalkBody,
  ) {
    return await this.collaborations.schedule(id, body);
  }

  @Post(':id/archive')
  async archive(@Param('id', { schema: collaborationIdParamSchema }) id: string) {
    return await this.collaborations.archive(id);
  }
}
