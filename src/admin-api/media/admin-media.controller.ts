import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '../../common/http/api-response';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';
import { AdminMediaService } from './admin-media.service';

@ApiTags('admin-media')
@Controller('admin/media')
@UseGuards(AdminAuthGuard)
export class AdminMediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Get()
  async list() {
    return apiSuccess(await this.media.list());
  }

  @Post('placeholder')
  async createPlaceholder(@Body() body: Record<string, unknown>) {
    return apiSuccess(await this.media.createPlaceholder(body));
  }
}
