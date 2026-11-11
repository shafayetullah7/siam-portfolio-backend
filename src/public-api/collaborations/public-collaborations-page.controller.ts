import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PublicCollaborationsPageService } from './public-collaborations-page.service';

@ApiTags('public-collaborations')
@Controller('public/collaborations-page')
export class PublicCollaborationsPageController {
  constructor(private readonly page: PublicCollaborationsPageService) {}

  @Get()
  @ApiOperation({ summary: 'Collaborations and academic service (P14 aggregate)' })
  @ApiOkResponse({ description: 'Page payload with enable gate' })
  async getPage() {
    return await this.page.getPage();
  }
}
