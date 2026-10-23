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
import { AdminPublicationsService } from './admin-publications.service';
import {
  createPublicationBodySchema,
  type CreatePublicationBody,
} from './dto/create-publication.dto';
import {
  listPublicationsQuerySchema,
  type ListPublicationsQuery,
} from './dto/list-publications-query.dto';
import { publicationIdParamSchema } from './dto/publication-id-params.dto';
import {
  publishPublicationBodySchema,
  type PublishPublicationBody,
} from './dto/publish-publication.dto';
import {
  schedulePublicationBodySchema,
  type SchedulePublicationBody,
} from './dto/schedule-publication.dto';
import {
  updatePublicationBodySchema,
  type UpdatePublicationBody,
} from './dto/update-publication.dto';
import {
  importConfirmBodySchema,
  type ImportConfirmBody,
} from './dto/import-confirm-body.dto';
import {
  importPreviewBodySchema,
  type ImportPreviewBody,
} from './dto/import-preview-body.dto';

@ApiTags('admin-publications')
@Controller('admin/publications')
@UseGuards(AdminAuthGuard)
export class AdminPublicationsController {
  constructor(private readonly publications: AdminPublicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List publications (admin; search for pickers)' })
  async list(
    @Query({ schema: listPublicationsQuerySchema }) query: ListPublicationsQuery,
  ) {
    return await this.publications.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create publication draft' })
  async create(
    @Body({ schema: createPublicationBodySchema }) body: CreatePublicationBody,
  ) {
    return await this.publications.create(body);
  }

  @Post('import/preview')
  @ApiOperation({ summary: 'Preview publication import from BibTeX or DOI' })
  async importPreview(
    @Body({ schema: importPreviewBodySchema }) body: ImportPreviewBody,
  ) {
    return await this.publications.importPreview(body);
  }

  @Post('import/confirm')
  @ApiOperation({ summary: 'Confirm publication import (create or merge draft)' })
  async importConfirm(
    @Body({ schema: importConfirmBodySchema }) body: ImportConfirmBody,
  ) {
    return await this.publications.importConfirm(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publication by id' })
  async get(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.get(id);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Preview publication (public detail shape)' })
  async preview(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.preview(id);
  }

  @Get(':id/citation')
  @ApiOperation({ summary: 'Formatted citation and BibTeX for publication' })
  async citation(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.citation(id);
  }

  @Get(':id/publish-check')
  @ApiOperation({ summary: 'Pre-publish validation checklist' })
  async publishCheck(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.getPublishCheck(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update publication draft' })
  async update(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
    @Body({ schema: updatePublicationBodySchema }) body: UpdatePublicationBody,
  ) {
    return await this.publications.update(id, body);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish publication' })
  async publish(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
    @Body({ schema: publishPublicationBodySchema }) body: PublishPublicationBody,
  ) {
    return await this.publications.publish(id, body);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish publication' })
  async unpublish(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.unpublish(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive publication' })
  async archive(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
  ) {
    return await this.publications.archive(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule publication' })
  async schedule(
    @Param('id', { schema: publicationIdParamSchema }) id: string,
    @Body({ schema: schedulePublicationBodySchema }) body: SchedulePublicationBody,
  ) {
    return await this.publications.schedule(id, new Date(body.scheduledAt));
  }
}
