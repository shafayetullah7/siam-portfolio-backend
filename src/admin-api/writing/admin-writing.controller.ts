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

  @Patch(':id')
  @ApiOperation({ summary: 'Update article draft' })
  async update(
    @Param('id', { schema: articleIdParamSchema }) id: string,
    @Body({ schema: updateArticleBodySchema }) body: UpdateArticleBody,
  ) {
    return await this.writing.update(id, body);
  }
}
