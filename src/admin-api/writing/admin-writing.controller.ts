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
import { AdminWritingService } from './admin-writing.service';
import { articleIdParamSchema } from './dto/article-id-params.dto';
import {
  createArticleBodySchema,
  type CreateArticleBody,
} from './dto/create-article.dto';
import {
  listWritingQuerySchema,
  type ListWritingQuery,
} from './dto/list-writing-query.dto';
import {
  publishArticleBodySchema,
  type PublishArticleBody,
} from './dto/publish-article.dto';
import {
  scheduleArticleBodySchema,
  type ScheduleArticleBody,
} from './dto/schedule-article.dto';
import {
  putArticleRelationsBodySchema,
  type PutArticleRelationsBody,
} from './dto/put-article-relations.dto';
import {
  updateArticleBodySchema,
  type UpdateArticleBody,
} from './dto/update-article.dto';

@ApiTags('admin-writing')
@Controller('admin/writing')
@UseGuards(AdminAuthGuard)
export class AdminWritingController {
  constructor(private readonly writing: AdminWritingService) {}

  @Get()
  @ApiOperation({ summary: 'List articles (admin; search and filters)' })
  async list(
    @Query({ schema: listWritingQuerySchema }) query: ListWritingQuery,
  ) {
    return await this.writing.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create article draft' })
  async create(
    @Body({ schema: createArticleBodySchema }) body: CreateArticleBody,
  ) {
    return await this.writing.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get article by id' })
  async get(@Param('id', { schema: articleIdParamSchema }) id: string) {
    return await this.writing.get(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Public detail preview (any status)' })
  async preview(@Param('id', { schema: articleIdParamSchema }) id: string) {
    return await this.writing.preview(id);
  }

  @Get(':id/relations')
  @ApiOperation({ summary: 'Get article relation ids' })
  async getRelations(
    @Param('id', { schema: articleIdParamSchema }) id: string,
  ) {
    return await this.writing.getRelations(id);
  }

  @Put(':id/relations')
  @ApiOperation({ summary: 'Replace article relations' })
  async putRelations(
    @Param('id', { schema: articleIdParamSchema }) id: string,
    @Body({ schema: putArticleRelationsBodySchema }) body: PutArticleRelationsBody,
  ) {
    return await this.writing.putRelations(id, body);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: articleIdParamSchema }) id: string,
  ) {
    return await this.writing.getPublishCheck(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update article draft' })
  async update(
    @Param('id', { schema: articleIdParamSchema }) id: string,
    @Body({ schema: updateArticleBodySchema }) body: UpdateArticleBody,
  ) {
    return await this.writing.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish article' })
  async publish(
    @Param('id', { schema: articleIdParamSchema }) id: string,
    @Body({ schema: publishArticleBodySchema }) body: PublishArticleBody,
  ) {
    return await this.writing.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish article' })
  async unpublish(@Param('id', { schema: articleIdParamSchema }) id: string) {
    return await this.writing.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive article' })
  async archive(@Param('id', { schema: articleIdParamSchema }) id: string) {
    return await this.writing.archive(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule article publish' })
  async schedule(
    @Param('id', { schema: articleIdParamSchema }) id: string,
    @Body({ schema: scheduleArticleBodySchema }) body: ScheduleArticleBody,
  ) {
    return await this.writing.schedule(id, new Date(body.scheduledAt));
  }
}
