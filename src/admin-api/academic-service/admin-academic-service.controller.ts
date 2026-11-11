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
import { AdminAcademicServiceService } from './admin-academic-service.service';
import { academicServiceIdParamSchema } from './dto/academic-service-id-params.dto';
import {
  createAcademicServiceBodySchema,
  type CreateAcademicServiceBody,
} from './dto/create-academic-service.dto';
import {
  listAcademicServiceQuerySchema,
  type ListAcademicServiceQuery,
} from './dto/list-academic-service-query.dto';
import {
  publishTalkBodySchema,
  type PublishTalkBody,
} from '../talks/dto/publish-talk.dto';
import {
  scheduleTalkBodySchema,
  type ScheduleTalkBody,
} from '../talks/dto/schedule-talk.dto';
import {
  updateAcademicServiceBodySchema,
  type UpdateAcademicServiceBody,
} from './dto/update-academic-service.dto';

@ApiTags('admin-academic-service')
@Controller('admin/academic-service')
@UseGuards(AdminAuthGuard)
export class AdminAcademicServiceController {
  constructor(private readonly academicService: AdminAcademicServiceService) {}

  @Get()
  @ApiOperation({ summary: 'List academic service entries (admin)' })
  async list(
    @Query({ schema: listAcademicServiceQuerySchema })
    query: ListAcademicServiceQuery,
  ) {
    return await this.academicService.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create academic service entry draft' })
  async create(
    @Body({ schema: createAcademicServiceBodySchema })
    body: CreateAcademicServiceBody,
  ) {
    return await this.academicService.create(body);
  }

  @Get(':id/publish-check')
  async publishCheck(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
  ) {
    return await this.academicService.publishCheck(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get academic service entry by id' })
  async get(@Param('id', { schema: academicServiceIdParamSchema }) id: string) {
    return await this.academicService.get(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update academic service entry' })
  async update(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
    @Body({ schema: updateAcademicServiceBodySchema })
    body: UpdateAcademicServiceBody,
  ) {
    return await this.academicService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete academic service entry' })
  async delete(@Param('id', { schema: academicServiceIdParamSchema }) id: string) {
    await this.academicService.delete(id);
    return null;
  }

  @Post(':id/publish')
  async publish(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
    @Body({ schema: publishTalkBodySchema }) body: PublishTalkBody,
  ) {
    return await this.academicService.publish(id, body);
  }

  @Post(':id/unpublish')
  async unpublish(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
  ) {
    return await this.academicService.unpublish(id);
  }

  @Post(':id/schedule')
  async schedule(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
    @Body({ schema: scheduleTalkBodySchema }) body: ScheduleTalkBody,
  ) {
    return await this.academicService.schedule(id, body);
  }

  @Post(':id/archive')
  async archive(
    @Param('id', { schema: academicServiceIdParamSchema }) id: string,
  ) {
    return await this.academicService.archive(id);
  }
}
